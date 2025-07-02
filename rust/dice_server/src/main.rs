use http_body_util::Full;
use hyper::Method;
use hyper::body::Bytes;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Request, Response};
use hyper_util::rt::TokioIo;
use opentelemetry::{
    KeyValue, global,
    logs::{LogRecord, Logger, LoggerProvider, Severity},
    metrics::{Counter, Histogram, MeterProvider},
    trace::{Span, SpanKind, Status, Tracer, TracerProvider},
};
use opentelemetry_otlp::{WithExportConfig, new_exporter};
use opentelemetry_sdk::{
    Resource,
    logs::{self as sdklogs, BatchConfigBuilder, BatchLogProcessor},
    metrics::{self as sdkmetrics, PeriodicReader, SdkMeterProvider},
    trace::{self as sdktrace, RandomIdGenerator, Sampler},
};
use rand::Rng;
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::{Arc, OnceLock};
use std::time::{Duration, SystemTime};
use tokio::net::TcpListener;

// Global telemetry handles
struct TelemetryHandles {
    tracer: BoxedTracer,
    logger: Arc<dyn Logger>,
    request_counter: Counter<u64>,
    request_duration: Histogram<f64>,
    dice_roll_counter: Counter<u64>,
}

fn get_telemetry() -> &'static TelemetryHandles {
    static TELEMETRY: OnceLock<TelemetryHandles> = OnceLock::new();
    TELEMETRY.get().expect("Telemetry not initialized")
}

async fn roll_dice(_: Request<hyper::body::Incoming>) -> Result<Response<Full<Bytes>>, Infallible> {
    let telemetry = get_telemetry();
    let start_time = SystemTime::now();

    // Generate random number
    let random_number = rand::thread_rng().gen_range(1..=6);

    // Log the dice roll event
    telemetry.logger.emit(
        LogRecord::builder()
            .with_severity(Severity::Info)
            .with_body(format!("Dice rolled: {}", random_number))
            .with_attributes(vec![
                KeyValue::new("dice.value", random_number as i64),
                KeyValue::new("game.type", "single_die"),
            ])
            .build(),
    );

    // Record metric for dice roll distribution
    telemetry
        .dice_roll_counter
        .add(1, &[KeyValue::new("dice.value", random_number as i64)]);

    // Record request duration metric
    let duration = start_time.elapsed().unwrap_or_default().as_secs_f64();
    telemetry
        .request_duration
        .record(duration, &[KeyValue::new("endpoint", "/rolldice")]);

    Ok(Response::new(Full::new(Bytes::from(
        random_number.to_string(),
    ))))
}

async fn handle(req: Request<hyper::body::Incoming>) -> Result<Response<Full<Bytes>>, Infallible> {
    let telemetry = get_telemetry();

    // Start a trace span for the request
    let mut span = telemetry
        .tracer
        .span_builder(format!("{} {}", req.method(), req.uri().path()))
        .with_kind(SpanKind::Server)
        .with_attributes(vec![
            KeyValue::new("http.method", req.method().to_string()),
            KeyValue::new("http.target", req.uri().path().to_string()),
            KeyValue::new("http.scheme", "http"),
        ])
        .start(&telemetry.tracer);

    // Increment request counter metric
    telemetry.request_counter.add(
        1,
        &[
            KeyValue::new("method", req.method().to_string()),
            KeyValue::new("endpoint", req.uri().path().to_string()),
        ],
    );

    // Log the incoming request
    telemetry.logger.emit(
        LogRecord::builder()
            .with_severity(Severity::Info)
            .with_body(format!(
                "Received request: {} {}",
                req.method(),
                req.uri().path()
            ))
            .with_attributes(vec![
                KeyValue::new("http.method", req.method().to_string()),
                KeyValue::new("http.path", req.uri().path().to_string()),
            ])
            .build(),
    );

    let response = match (req.method(), req.uri().path()) {
        (&Method::GET, "/rolldice") => {
            span.set_status(Status::ok());
            span.set_attribute(KeyValue::new("http.status_code", 200i64));
            roll_dice(req).await
        }
        _ => {
            span.set_status(Status::error("Not Found"));
            span.set_attribute(KeyValue::new("http.status_code", 404i64));

            // Log 404 events
            telemetry.logger.emit(
                LogRecord::builder()
                    .with_severity(Severity::Warn)
                    .with_body("404 Not Found")
                    .with_attributes(vec![
                        KeyValue::new("http.path", req.uri().path().to_string()),
                        KeyValue::new("error.type", "not_found"),
                    ])
                    .build(),
            );

            Ok(Response::builder()
                .status(404)
                .body(Full::new(Bytes::from("Not Found")))
                .unwrap())
        }
    };

    // End the span
    span.end();
    response
}

fn init_telemetry() -> Result<(), Box<dyn std::error::Error>> {
    // Get Grafana Cloud configuration from environment variables
    let otlp_endpoint = std::env::var("GRAFANA_OTLP_ENDPOINT")
        .unwrap_or_else(|_| "https://otlp-gateway-prod-us-central-0.grafana.net:443".to_string());

    let grafana_instance_id = std::env::var("GRAFANA_INSTANCE_ID")
        .expect("GRAFANA_INSTANCE_ID environment variable must be set");

    let grafana_api_key =
        std::env::var("GRAFANA_API_KEY").expect("GRAFANA_API_KEY environment variable must be set");

    // Create metadata for authorization that will be shared across all exporters
    let metadata = tonic::metadata::MetadataMap::from_iter(vec![(
        "authorization",
        format!(
            "Basic {}",
            base64::encode(format!("{}:{}", grafana_instance_id, grafana_api_key))
        )
        .parse()
        .unwrap(),
    )]);

    // Common resource attributes for all telemetry
    let resource = Resource::new(vec![
        KeyValue::new("service.name", "dice_server"),
        KeyValue::new("service.version", "1.0.0"),
        KeyValue::new("deployment.environment", "production"),
        KeyValue::new("host.name", hostname::get()?.to_string_lossy().into_owned()),
    ]);

    // Initialize Traces
    println!("Initializing trace provider...");
    let trace_exporter = new_exporter()
        .tonic() // Using gRPC as requested
        .with_endpoint(&otlp_endpoint)
        .with_timeout(Duration::from_secs(10))
        .with_metadata(metadata.clone())
        .build_span_exporter()?;

    let trace_provider = sdktrace::TracerProvider::builder()
        .with_batch_exporter(trace_exporter, opentelemetry_sdk::runtime::Tokio)
        .with_sampler(Sampler::AlwaysOn)
        .with_id_generator(RandomIdGenerator::default())
        .with_resource(resource.clone())
        .build();

    global::set_tracer_provider(trace_provider.clone());

    // Initialize Metrics
    println!("Initializing metrics provider...");
    let metrics_exporter = new_exporter()
        .tonic() // Using gRPC
        .with_endpoint(&otlp_endpoint)
        .with_timeout(Duration::from_secs(10))
        .with_metadata(metadata.clone())
        .build_metrics_exporter()?;

    let metrics_reader =
        PeriodicReader::builder(metrics_exporter, opentelemetry_sdk::runtime::Tokio)
            .with_interval(Duration::from_secs(60)) // Export metrics every 60 seconds
            .build();

    let meter_provider = SdkMeterProvider::builder()
        .with_reader(metrics_reader)
        .with_resource(resource.clone())
        .build();

    global::set_meter_provider(meter_provider.clone());

    // Initialize Logs
    println!("Initializing logs provider...");
    let logs_exporter = new_exporter()
        .tonic() // Using gRPC
        .with_endpoint(&otlp_endpoint)
        .with_timeout(Duration::from_secs(10))
        .with_metadata(metadata)
        .build_log_exporter()?;

    let log_processor =
        BatchLogProcessor::builder(logs_exporter, opentelemetry_sdk::runtime::Tokio)
            .with_batch_config(
                BatchConfigBuilder::default()
                    .with_max_queue_size(2048)
                    .with_max_export_batch_size(512)
                    .with_scheduled_delay(Duration::from_secs(5))
                    .build(),
            )
            .build();

    let logger_provider = sdklogs::LoggerProvider::builder()
        .with_log_processor(log_processor)
        .with_resource(resource)
        .build();

    // Note: OpenTelemetry logs don't have a global provider yet in Rust,
    // so we need to store the logger separately
    let logger = logger_provider.logger("dice_server");

    // Create metrics instruments
    let meter = global::meter("dice_server");
    let request_counter = meter
        .u64_counter("http.server.request.count")
        .with_description("Total number of HTTP requests")
        .init();

    let request_duration = meter
        .f64_histogram("http.server.request.duration")
        .with_description("HTTP request duration in seconds")
        .with_unit("s")
        .init();

    let dice_roll_counter = meter
        .u64_counter("dice.rolls.total")
        .with_description("Total number of dice rolls by value")
        .init();

    // Store all telemetry handles
    static TELEMETRY: OnceLock<TelemetryHandles> = OnceLock::new();
    TELEMETRY
        .set(TelemetryHandles {
            tracer: global::tracer("dice_server"),
            logger: Arc::new(logger),
            request_counter,
            request_duration,
            dice_roll_counter,
        })
        .map_err(|_| "Failed to initialize telemetry")?;

    println!("All telemetry providers initialized successfully!");
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Initialize all telemetry providers
    init_telemetry()?;

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    let listener = TcpListener::bind(addr).await?;

    println!("Dice server listening on {}", addr);
    println!("Sending traces, metrics, and logs to Grafana Cloud via gRPC");

    loop {
        let (stream, _) = listener.accept().await?;
        let io = TokioIo::new(stream);

        tokio::task::spawn(async move {
            if let Err(err) = http1::Builder::new()
                .serve_connection(io, service_fn(handle))
                .await
            {
                eprintln!("Error serving connection: {:?}", err);
            }
        });
    }
}
