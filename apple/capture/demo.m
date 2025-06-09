#import <Foundation/Foundation.h>
#import <Metal/Metal.h>
#import <simd/simd.h>

@interface ProperGPUCapture : NSObject
@property (nonatomic, strong) id<MTLDevice> device;
@property (nonatomic, strong) id<MTLCommandQueue> commandQueue;
@property (nonatomic, strong) id<MTLComputePipelineState> computePipeline;
@property (nonatomic, strong) id<MTLBuffer> dataBuffer;
@property (nonatomic, strong) NSURL *captureURL;
@end

@implementation ProperGPUCapture

- (instancetype)init {
    self = [super init];
    if (self) {
        // Initialize Metal with proper error checking
        self.device = MTLCreateSystemDefaultDevice();
        if (!self.device) {
            NSLog(@"Metal is not supported on this device");
            return nil;
        }
        
        NSLog(@"Metal device: %@", self.device.name);
        
        // Create command queue with a descriptive label
        self.commandQueue = [self.device newCommandQueue];
        self.commandQueue.label = @"Main Compute Queue";
        
        // Set up our compute pipeline
        if (![self buildComputePipeline]) {
            return nil;
        }
        
        // Create our data buffer
        [self createBuffers];
        
        // Prepare capture file URL
        [self prepareCaptureURL];
    }
    return self;
}

- (BOOL)buildComputePipeline {
    NSError *error = nil;
    
    // Our simple compute shader with descriptive comments
    NSString *kernelSource = @"#include <metal_stdlib>\n"
                            @"using namespace metal;\n"
                            @"\n"
                            @"// Simple kernel that doubles each value in the buffer\n"
                            @"kernel void doubleValues(device float* data [[buffer(0)]],\n"
                            @"                        uint id [[thread_position_in_grid]]) {\n"
                            @"    // Read, double, and write back\n"
                            @"    data[id] = data[id] * 2.0;\n"
                            @"}\n";
    
    // Compile the shader source
    id<MTLLibrary> library = [self.device newLibraryWithSource:kernelSource
                                                      options:nil
                                                        error:&error];
    if (!library) {
        NSLog(@"Failed to create shader library: %@", error);
        return NO;
    }
    
    // Get the kernel function
    id<MTLFunction> kernelFunction = [library newFunctionWithName:@"doubleValues"];
    if (!kernelFunction) {
        NSLog(@"Failed to find kernel function 'doubleValues'");
        return NO;
    }
    kernelFunction.label = @"Double Values Compute Function";
    
    // Create the compute pipeline state
    self.computePipeline = [self.device newComputePipelineStateWithFunction:kernelFunction
                                                                     error:&error];
    if (!self.computePipeline) {
        NSLog(@"Failed to create compute pipeline: %@", error);
        return NO;
    }
    
    NSLog(@"✓ Compute pipeline created successfully");
    NSLog(@"  Max threads per threadgroup: %lu", 
          (unsigned long)self.computePipeline.maxTotalThreadsPerThreadgroup);
    
    return YES;
}

- (void)createBuffers {
    // Create a buffer with test data
    const NSUInteger arrayLength = 1024;
    const NSUInteger bufferSize = arrayLength * sizeof(float);
    
    self.dataBuffer = [self.device newBufferWithLength:bufferSize
                                              options:MTLResourceStorageModeShared];
    self.dataBuffer.label = @"Compute Data Buffer";
    
    // Initialize with sequential values
    float *dataPointer = (float *)self.dataBuffer.contents;
    for (NSUInteger i = 0; i < arrayLength; i++) {
        dataPointer[i] = (float)i;
    }
    
    NSLog(@"✓ Created buffer with %lu floats", (unsigned long)arrayLength);
}

- (void)prepareCaptureURL {
    // Create a filename with timestamp
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateFormat:@"yyyy-MM-dd_HH-mm-ss"];
    NSString *timestamp = [formatter stringFromDate:[NSDate date]];
    NSString *filename = [NSString stringWithFormat:@"compute-capture_%@.gputrace", timestamp];
    
    // Use the desktop for easier access
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDesktopDirectory, NSUserDomainMask, YES);
    NSString *desktopPath = [paths firstObject];
    NSString *filePath = [desktopPath stringByAppendingPathComponent:filename];
    
    self.captureURL = [NSURL fileURLWithPath:filePath];
    NSLog(@"Capture will be saved to: %@", filePath);
}

- (BOOL)checkCaptureSupport {
    MTLCaptureManager *captureManager = [MTLCaptureManager sharedCaptureManager];
    
    NSLog(@"\n=== Checking Capture Support ===");
    
    // Check if Metal capture is enabled
    if (getenv("MTL_CAPTURE_ENABLED")) {
        NSLog(@"✓ MTL_CAPTURE_ENABLED is set");
    } else {
        NSLog(@"⚠️  MTL_CAPTURE_ENABLED is not set");
        NSLog(@"   Run with: MTL_CAPTURE_ENABLED=1 %s", getprogname());
    }
    
    // Check support for different destinations
    BOOL supportsDeveloperTools = [captureManager supportsDestination:MTLCaptureDestinationDeveloperTools];
    BOOL supportsGPUTrace = [captureManager supportsDestination:MTLCaptureDestinationGPUTraceDocument];
    
    NSLog(@"Developer Tools capture: %@", supportsDeveloperTools ? @"Supported" : @"Not supported");
    NSLog(@"GPU Trace Document capture: %@", supportsGPUTrace ? @"Supported" : @"Not supported");
    
    if (!supportsGPUTrace) {
        NSLog(@"\n⚠️  GPU trace capture is not supported. Possible reasons:");
        NSLog(@"1. MTL_CAPTURE_ENABLED environment variable not set");
        NSLog(@"2. Running on a system that doesn't support trace files");
        NSLog(@"3. Metal capture not properly configured");
        return NO;
    }
    
    return YES;
}

- (void)performCapture {
    MTLCaptureManager *captureManager = [MTLCaptureManager sharedCaptureManager];
    
    // Create capture descriptor
    MTLCaptureDescriptor *captureDescriptor = [[MTLCaptureDescriptor alloc] init];
    captureDescriptor.captureObject = self.device;  // Capture all work on this device
    captureDescriptor.destination = MTLCaptureDestinationGPUTraceDocument;
    captureDescriptor.outputURL = self.captureURL;
    
    NSLog(@"\n=== Starting GPU Capture ===");
    
    // Start the capture
    NSError *error = nil;
    BOOL success = [captureManager startCaptureWithDescriptor:captureDescriptor error:&error];
    
    if (!success) {
        NSLog(@"❌ Failed to start capture: %@", error.localizedDescription);
        return;
    }
    
    NSLog(@"✓ GPU capture started");
    
    // Run several iterations of compute work
    // The capture will record all of these
    for (int iteration = 0; iteration < 3; iteration++) {
        NSLog(@"\nRunning compute iteration %d", iteration + 1);
        
        // Create command buffer - this will be captured
        id<MTLCommandBuffer> commandBuffer = [self.commandQueue commandBuffer];
        commandBuffer.label = [NSString stringWithFormat:@"Compute Iteration %d", iteration + 1];
        
        // Create compute encoder
        id<MTLComputeCommandEncoder> computeEncoder = [commandBuffer computeCommandEncoder];
        computeEncoder.label = @"Double Values Encoder";
        
        // Set up the compute command
        [computeEncoder setComputePipelineState:self.computePipeline];
        [computeEncoder setBuffer:self.dataBuffer offset:0 atIndex:0];
        
        // Calculate dispatch parameters
        NSUInteger threadGroupSize = MIN(self.computePipeline.maxTotalThreadsPerThreadgroup, 64);
        MTLSize threadsPerThreadgroup = MTLSizeMake(threadGroupSize, 1, 1);
        MTLSize numThreadgroups = MTLSizeMake((1024 + threadGroupSize - 1) / threadGroupSize, 1, 1);
        
        // Dispatch the compute work
        [computeEncoder dispatchThreadgroups:numThreadgroups 
                       threadsPerThreadgroup:threadsPerThreadgroup];
        
        // End encoding
        [computeEncoder endEncoding];
        
        // Commit and wait for completion
        [commandBuffer commit];
        [commandBuffer waitUntilCompleted];
        
        // Check results
        if (commandBuffer.error) {
            NSLog(@"❌ Command buffer error: %@", commandBuffer.error);
        } else {
            float *results = (float *)self.dataBuffer.contents;
            NSLog(@"✓ Results after iteration %d: %.1f, %.1f, %.1f, %.1f, %.1f", 
                  iteration + 1,
                  results[0], results[1], results[2], results[3], results[4]);
        }
    }
    
    // Stop the capture
    [captureManager stopCapture];
    NSLog(@"\n✓ GPU capture stopped");
    NSLog(@"Capture saved to: %@", self.captureURL.path);
    
    // Try to reveal the file in Finder
    [[NSWorkspace sharedWorkspace] activateFileViewerSelectingURLs:@[self.captureURL]];
}

- (void)run {
    NSLog(@"=== Metal GPU Capture Demo ===");
    NSLog(@"This demo shows how to properly capture GPU commands\n");
    
    // First check if capture is supported
    if (![self checkCaptureSupport]) {
        NSLog(@"\n❌ Cannot proceed without GPU capture support");
        NSLog(@"Please run with: MTL_CAPTURE_ENABLED=1 ./gpu_capture_demo");
        return;
    }
    
    // Perform the capture
    [self performCapture];
    
    NSLog(@"\n=== Demo Complete ===");
    NSLog(@"You can open the .gputrace file in Xcode to analyze the GPU commands");
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        ProperGPUCapture *capture = [[ProperGPUCapture alloc] init];
        if (capture) {
            [capture run];
        }
    }
    return 0;
}
