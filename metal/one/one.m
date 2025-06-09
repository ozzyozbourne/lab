// main.m
// Metal Window Sample - Hybrid Objective-C and C approach
//
// This version uses C functions and structures where they improve clarity,
// while keeping Objective-C for framework integration

#import <Cocoa/Cocoa.h>
#import <Metal/Metal.h>
#import <MetalKit/MetalKit.h>

#pragma mark - C Structures and Types

// Using C structures for simple data makes intent clearer
typedef struct {
    float red;
    float green;
    float blue;
    float alpha;
} Color;

typedef struct {
    float x, y;
    float width, height;
} WindowRect;

// C enums are cleaner than Objective-C string constants for states
typedef enum {
    RendererStateReady,
    RendererStateDrawing,
    RendererStateError
} RendererState;

#pragma mark - C Utility Functions

// Pure C functions for calculations and utilities
static inline Color MakeColor(float r, float g, float b, float a) {
    return (Color){r, g, b, a};
}

static inline MTLClearColor ColorToMTLClearColor(Color color) {
    return MTLClearColorMake(color.red, color.green, color.blue, color.alpha);
}

static inline NSRect WindowRectToNSRect(WindowRect rect) {
    return NSMakeRect(rect.x, rect.y, rect.width, rect.height);
}

// Configuration constants in C style
static const WindowRect kDefaultWindowRect = {100.0f, 100.0f, 512.0f, 512.0f};
static const Color kClearColor = {1.0f, 0.0f, 0.0f, 1.0f}; // Red

#pragma mark - Renderer Core Logic in C

// C structure to hold renderer state
typedef struct {
    id<MTLDevice> device;
    id<MTLCommandQueue> commandQueue;
    RendererState state;
} RendererCore;

// C functions for core rendering logic
static RendererCore* CreateRendererCore(id<MTLDevice> device) {
    RendererCore* core = calloc(1, sizeof(RendererCore));
    if (core) {
        core->device = device;
        core->commandQueue = [device newCommandQueue];
        core->state = RendererStateReady;
    }
    return core;
}

static void DestroyRendererCore(RendererCore* core) {
    if (core) {
        // ARC handles the Objective-C objects, we just free the C struct
        free(core);
    }
}

static void RenderFrame(RendererCore* core, MTKView* view) {
    if (!core || core->state == RendererStateError) return;
    
    core->state = RendererStateDrawing;
    
    // Create autorelease pool for this frame
    @autoreleasepool {
        // Get command buffer
        id<MTLCommandBuffer> commandBuffer = [core->commandQueue commandBuffer];
        if (!commandBuffer) {
            core->state = RendererStateError;
            return;
        }
        
        // Get render pass descriptor
        MTLRenderPassDescriptor* rpd = view.currentRenderPassDescriptor;
        if (!rpd) {
            core->state = RendererStateReady;
            return;
        }
        
        // Create encoder and immediately end (just clearing for now)
        id<MTLRenderCommandEncoder> encoder = [commandBuffer renderCommandEncoderWithDescriptor:rpd];
        [encoder endEncoding];
        
        // Present and commit
        [commandBuffer presentDrawable:view.currentDrawable];
        [commandBuffer commit];
    }
    
    core->state = RendererStateReady;
}

#pragma mark - Menu Creation Helpers in C

typedef struct {
    const char* title;
    SEL action;
    const char* shortcut;
} MenuItem;

// C function to create menu items - much cleaner than repeated Objective-C calls
static NSMenuItem* CreateMenuItem(const MenuItem* item) {
    NSString* title = [NSString stringWithUTF8String:item->title];
    NSString* key = item->shortcut ? [NSString stringWithUTF8String:item->shortcut] : @"";
    
    NSMenuItem* menuItem = [[NSMenuItem alloc] initWithTitle:title
                                                       action:item->action
                                                keyEquivalent:key];
    return menuItem;
}

static NSMenu* CreateMenuWithItems(const char* title, const MenuItem* items, size_t count) {
    NSMenu* menu = [[NSMenu alloc] initWithTitle:[NSString stringWithUTF8String:title]];
    
    for (size_t i = 0; i < count; i++) {
        NSMenuItem* item = CreateMenuItem(&items[i]);
        [menu addItem:item];
    }
    
    return menu;
}

#pragma mark - Objective-C Classes (Thin Wrappers)

// Renderer is now a thin Objective-C wrapper around our C core
@interface Renderer : NSObject {
    RendererCore* _core;
}
- (instancetype)initWithDevice:(id<MTLDevice>)device;
- (void)drawInView:(MTKView*)view;
@end

@implementation Renderer

- (instancetype)initWithDevice:(id<MTLDevice>)device {
    self = [super init];
    if (self) {
        _core = CreateRendererCore(device);
        if (!_core) return nil;
    }
    return self;
}

- (void)dealloc {
    DestroyRendererCore(_core);
}

- (void)drawInView:(MTKView*)view {
    RenderFrame(_core, view);
}

@end

#pragma mark - View Delegate (Minimal Objective-C)

@interface MyMTKViewDelegate : NSObject <MTKViewDelegate> {
    Renderer* _renderer;
}
@end

@implementation MyMTKViewDelegate

- (instancetype)initWithDevice:(id<MTLDevice>)device {
    self = [super init];
    if (self) {
        _renderer = [[Renderer alloc] initWithDevice:device];
    }
    return self;
}

- (void)drawInMTKView:(MTKView*)view {
    [_renderer drawInView:view];
}

- (void)mtkView:(MTKView*)view drawableSizeWillChange:(CGSize)size {
    // Handle resize if needed
}

@end

#pragma mark - Application Delegate

@interface MyAppDelegate : NSObject <NSApplicationDelegate> {
    NSWindow* _window;
    MTKView* _metalView;
    MyMTKViewDelegate* _viewDelegate;
}
@end

@implementation MyAppDelegate

// C function for initialization logic
static BOOL InitializeMetalApplication(MyAppDelegate* self) {
    // Get Metal device
    id<MTLDevice> device = MTLCreateSystemDefaultDevice();
    if (!device) {
        NSLog(@"Metal is not supported on this device");
        return NO;
    }
    
    // Create window using our C structures
    NSRect frame = WindowRectToNSRect(kDefaultWindowRect);
    
    self->_window = [[NSWindow alloc] initWithContentRect:frame
                                                styleMask:(NSWindowStyleMaskTitled |
                                                          NSWindowStyleMaskClosable |
                                                          NSWindowStyleMaskMiniaturizable |
                                                          NSWindowStyleMaskResizable)
                                                  backing:NSBackingStoreBuffered
                                                    defer:NO];
    
    // Create and configure Metal view
    self->_metalView = [[MTKView alloc] initWithFrame:frame device:device];
    self->_metalView.colorPixelFormat = MTLPixelFormatBGRA8Unorm_sRGB;
    self->_metalView.clearColor = ColorToMTLClearColor(kClearColor);
    
    // Set up delegate
    self->_viewDelegate = [[MyMTKViewDelegate alloc] initWithDevice:device];
    self->_metalView.delegate = self->_viewDelegate;
    
    // Configure window
    [self->_window setContentView:self->_metalView];
    [self->_window setTitle:@"00 - Window (Objective-C + C)"];
    
    return YES;
}

- (void)applicationDidFinishLaunching:(NSNotification*)notification {
    if (!InitializeMetalApplication(self)) {
        [NSApp terminate:self];
        return;
    }
    
    [_window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
}

- (void)applicationWillFinishLaunching:(NSNotification*)notification {
    // Create menu bar using our C helper functions
    NSMenu* mainMenu = [[NSMenu alloc] init];
    
    // Application menu items
    NSString* appName = [[NSProcessInfo processInfo] processName];
    char quitTitle[256];
    snprintf(quitTitle, sizeof(quitTitle), "Quit %s", [appName UTF8String]);
    
    const MenuItem appItems[] = {
        {quitTitle, @selector(terminate:), "q"}
    };
    
    NSMenu* appMenu = CreateMenuWithItems("Application", appItems, 1);
    NSMenuItem* appMenuItem = [[NSMenuItem alloc] init];
    [appMenuItem setSubmenu:appMenu];
    
    // Window menu items
    const MenuItem windowItems[] = {
        {"Close Window", @selector(performClose:), "w"},
        {"Minimize", @selector(performMiniaturize:), "m"}
    };
    
    NSMenu* windowMenu = CreateMenuWithItems("Window", windowItems, 2);
    NSMenuItem* windowMenuItem = [[NSMenuItem alloc] init];
    [windowMenuItem setSubmenu:windowMenu];
    
    // Assemble main menu
    [mainMenu addItem:appMenuItem];
    [mainMenu addItem:windowMenuItem];
    [NSApp setMainMenu:mainMenu];
    
    [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication*)sender {
    return YES;
}

@end

#pragma mark - Main Function

int main(int argc, const char* argv[]) {
    @autoreleasepool {
        NSApplication* app = [NSApplication sharedApplication];
        MyAppDelegate* delegate = [[MyAppDelegate alloc] init];
        [app setDelegate:delegate];
        [app run];
    }
    return 0;
}
