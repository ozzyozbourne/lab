#import <Cocoa/Cocoa.h>
#import <Metal/Metal.h>
#import <MetalKit/MetalKit.h>

// Our compute handler class
@interface ComputeHandler : NSObject
@property (nonatomic, strong) id<MTLDevice> device;
@property (nonatomic, strong) id<MTLCommandQueue> commandQueue;
@property (nonatomic, strong) id<MTLComputePipelineState> computePipeline;
@property (nonatomic, strong) id<MTLBuffer> dataBuffer;
@property (nonatomic, assign) BOOL captureEnabled;
@end

@implementation ComputeHandler

- (instancetype)init {
    self = [super init];
    if (self) {
        self.device = MTLCreateSystemDefaultDevice();
        self.commandQueue = [self.device newCommandQueue];
        [self setupComputePipeline];
        [self createBuffers];
        self.captureEnabled = NO;
    }
    return self;
}

- (void)setupComputePipeline {
    NSString *source = @"#include <metal_stdlib>\n"
                      @"using namespace metal;\n"
                      @"kernel void doubleValues(device float* data [[buffer(0)]],\n"
                      @"                        uint id [[thread_position_in_grid]]) {\n"
                      @"    data[id] = data[id] * 2.0;\n"
                      @"}\n";
    
    NSError *error;
    id<MTLLibrary> library = [self.device newLibraryWithSource:source options:nil error:&error];
    id<MTLFunction> function = [library newFunctionWithName:@"doubleValues"];
    self.computePipeline = [self.device newComputePipelineStateWithFunction:function error:&error];
}

- (void)createBuffers {
    NSUInteger bufferSize = 1024 * sizeof(float);
    self.dataBuffer = [self.device newBufferWithLength:bufferSize 
                                             options:MTLResourceStorageModeShared];
    
    float *data = (float *)self.dataBuffer.contents;
    for (int i = 0; i < 1024; i++) {
        data[i] = (float)i;
    }
}

- (void)runComputeWorkload {
    // Start capture if enabled
    if (self.captureEnabled) {
        [self startCapture];
        self.captureEnabled = NO; // Only capture once
    }
    
    id<MTLCommandBuffer> commandBuffer = [self.commandQueue commandBuffer];
    id<MTLComputeCommandEncoder> encoder = [commandBuffer computeCommandEncoder];
    
    [encoder setComputePipelineState:self.computePipeline];
    [encoder setBuffer:self.dataBuffer offset:0 atIndex:0];
    
    MTLSize threadGroupSize = MTLSizeMake(64, 1, 1);
    MTLSize numThreadGroups = MTLSizeMake(16, 1, 1);
    
    [encoder dispatchThreadgroups:numThreadGroups 
            threadsPerThreadgroup:threadGroupSize];
    [encoder endEncoding];
    
    [commandBuffer commit];
    [commandBuffer waitUntilCompleted];
    
    // Check results
    float *results = (float *)self.dataBuffer.contents;
    NSLog(@"Compute results: %.1f, %.1f, %.1f, %.1f, %.1f",
          results[0], results[1], results[2], results[3], results[4]);
}

- (void)startCapture {
    MTLCaptureManager *captureManager = [MTLCaptureManager sharedCaptureManager];
    
    // Check support for different capture types
    NSLog(@"Checking capture support:");
    NSLog(@"- Developer Tools: %@", 
          [captureManager supportsDestination:MTLCaptureDestinationDeveloperTools] ? @"YES" : @"NO");
    NSLog(@"- GPU Trace Document: %@", 
          [captureManager supportsDestination:MTLCaptureDestinationGPUTraceDocument] ? @"YES" : @"NO");
    
    // Try GPU trace document first
    if ([captureManager supportsDestination:MTLCaptureDestinationGPUTraceDocument]) {
        NSString *filename = [NSString stringWithFormat:@"capture_%@.gputrace", 
                            [[NSDate date] descriptionWithLocale:nil]];
        NSString *path = [NSTemporaryDirectory() stringByAppendingPathComponent:filename];
        NSURL *url = [NSURL fileURLWithPath:path];
        
        MTLCaptureDescriptor *descriptor = [[MTLCaptureDescriptor alloc] init];
        descriptor.captureObject = self.device;
        descriptor.destination = MTLCaptureDestinationGPUTraceDocument;
        descriptor.outputURL = url;
        
        NSError *error;
        if ([captureManager startCaptureWithDescriptor:descriptor error:&error]) {
            NSLog(@"✓ GPU trace capture started - will save to: %@", path);
            
            // Run some work
            for (int i = 0; i < 3; i++) {
                [self runComputeWorkload];
            }
            
            [captureManager stopCapture];
            NSLog(@"✓ GPU trace capture completed");
            
            // Try to open the file
            [[NSWorkspace sharedWorkspace] openURL:url];
        } else {
            NSLog(@"✗ Failed to start GPU trace capture: %@", error);
        }
    }
    // Fall back to developer tools if available
    else if ([captureManager supportsDestination:MTLCaptureDestinationDeveloperTools]) {
        MTLCaptureDescriptor *descriptor = [[MTLCaptureDescriptor alloc] init];
        descriptor.captureObject = self.device;
        descriptor.destination = MTLCaptureDestinationDeveloperTools;
        
        NSError *error;
        if ([captureManager startCaptureWithDescriptor:descriptor error:&error]) {
            NSLog(@"✓ Developer tools capture started");
            NSLog(@"  (Check Xcode → Debug → Capture GPU Frame)");
            
            // Run some work
            for (int i = 0; i < 3; i++) {
                [self runComputeWorkload];
            }
            
            [captureManager stopCapture];
            NSLog(@"✓ Developer tools capture completed");
        } else {
            NSLog(@"✗ Failed to start developer tools capture: %@", error);
        }
    } else {
        NSLog(@"✗ No GPU capture methods are supported on this system");
    }
}

@end

// Application delegate
@interface AppDelegate : NSObject <NSApplicationDelegate>
@property (strong) NSWindow *window;
@property (strong) ComputeHandler *computeHandler;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    // Create a window (even though we won't show it)
    self.window = [[NSWindow alloc] initWithContentRect:NSMakeRect(0, 0, 400, 300)
                                              styleMask:NSWindowStyleMaskTitled
                                                backing:NSBackingStoreBuffered
                                                  defer:NO];
    
    // Initialize our compute handler
    self.computeHandler = [[ComputeHandler alloc] init];
    
    NSLog(@"=== GPU Capture Test with Application Context ===");
    NSLog(@"Device: %@", self.computeHandler.device.name);
    NSLog(@"Has window context: YES");
    NSLog(@"Running as NSApplication: YES");
    
    // Enable capture and run
    self.computeHandler.captureEnabled = YES;
    [self.computeHandler runComputeWorkload];
    
    // Exit after a short delay to ensure capture completes
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 2 * NSEC_PER_SEC), 
                   dispatch_get_main_queue(), ^{
        [NSApp terminate:nil];
    });
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSApplication *app = [NSApplication sharedApplication];
        AppDelegate *delegate = [[AppDelegate alloc] init];
        [app setDelegate:delegate];
        [app run];
    }
    return 0;
}
