#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Base function signature - this NEVER changes!
typedef char* (*Handler)(const char* input);

// ===========================================
// BASE HANDLERS (original implementations)
// ===========================================

char* hello_handler(const char* input) {
    char* result = malloc(100);
    snprintf(result, 100, "Hello, %s!", input);
    return result;
}

char* upper_handler(const char* input) {
    char* result = malloc(strlen(input) + 1);
    strcpy(result, input);
    for (int i = 0; result[i]; i++) {
        if (result[i] >= 'a' && result[i] <= 'z') {
            result[i] = result[i] - 32;
        }
    }
    return result;
}

// ===========================================
// LOGGING DECORATOR
// ===========================================

// The "closure" struct that captures the original handler
typedef struct {
    Handler original_handler;  // Captured function
    char* log_prefix;         // Additional data we need
} LoggingClosure;

// Global storage for our closure (in real code, use better approach)
static LoggingClosure* g_logging_closure = NULL;

// The decorated function implementation
char* logging_handler_impl(const char* input) {
    LoggingClosure* closure = g_logging_closure;
    
    if (!closure) {
        printf("[ERROR] No logging closure set!\n");
        return strdup("Error: No closure");
    }
    
    printf("[%s] Processing: %s\n", closure->log_prefix, input);
    
    // Call the original handler
    char* result = closure->original_handler(input);
    
    printf("[%s] Result: %s\n", closure->log_prefix, result);
    return result;
}

// Decorator factory - returns a Handler with same signature!
Handler create_logging_decorator(Handler original, const char* prefix) {
    LoggingClosure* closure = malloc(sizeof(LoggingClosure));
    closure->original_handler = original;
    closure->log_prefix = strdup(prefix);
    
    // Store closure globally (in real code, you'd use a better approach)
    g_logging_closure = closure;
    
    return logging_handler_impl;  // Return function with SAME signature!
}

// ===========================================
// TIMING DECORATOR  
// ===========================================

typedef struct {
    Handler original_handler;
    char* timer_name;
} TimingClosure;

// Global storage for timing closure
static TimingClosure* g_timing_closure = NULL;

char* timing_handler_impl(const char* input) {
    TimingClosure* closure = g_timing_closure;
    
    if (!closure) {
        printf("[ERROR] No timing closure set!\n");
        return strdup("Error: No closure");
    }
    
    clock_t start = clock();
    
    // Call original handler
    char* result = closure->original_handler(input);
    
    clock_t end = clock();
    double cpu_time_used = ((double) (end - start)) / CLOCKS_PER_SEC;
    printf("[TIMER:%s] Execution time: %f seconds\n", closure->timer_name, cpu_time_used);
    
    return result;
}

Handler create_timing_decorator(Handler original, const char* name) {
    TimingClosure* closure = malloc(sizeof(TimingClosure));
    closure->original_handler = original;
    closure->timer_name = strdup(name);
    
    g_timing_closure = closure;
    
    return timing_handler_impl;  // Same signature!
}

// ===========================================
// VALIDATION DECORATOR
// ===========================================

typedef struct {
    Handler original_handler;
    int min_length;
} ValidationClosure;

// Global storage for validation closure
static ValidationClosure* g_validation_closure = NULL;

char* validation_handler_impl(const char* input) {
    ValidationClosure* closure = g_validation_closure;
    
    if (!closure) {
        printf("[ERROR] No validation closure set!\n");
        return strdup("Error: No closure");
    }
    
    if (strlen(input) < closure->min_length) {
        char* error = malloc(100);
        snprintf(error, 100, "Error: Input too short (min %d chars)", closure->min_length);
        return error;
    }
    
    // Input is valid, call original
    return closure->original_handler(input);
}

Handler create_validation_decorator(Handler original, int min_len) {
    ValidationClosure* closure = malloc(sizeof(ValidationClosure));
    closure->original_handler = original;
    closure->min_length = min_len;
    
    g_validation_closure = closure;
    
    return validation_handler_impl;  // Same signature!
}

// ===========================================
// DEMONSTRATION
// ===========================================

int main() {
    printf("=== C Decorator Pattern Demo ===\n\n");
    
    // 1. Basic handler
    printf("1. Basic handler:\n");
    Handler basic = hello_handler;
    char* result1 = basic("World");
    printf("   %s\n\n", result1);
    free(result1);
    
    // 2. Decorated with logging (same signature!)
    printf("2. With logging decorator:\n");
    Handler logged = create_logging_decorator(hello_handler, "LOG");
    char* result2 = logged("Alice");
    printf("\n");
    free(result2);
    
    // 3. Decorated with timing (same signature!)
    printf("3. With timing decorator:\n");
    Handler timed = create_timing_decorator(upper_handler, "UPPER");
    char* result3 = timed("hello world");
    printf("   %s\n\n", result3);
    free(result3);
    
    // 4. Decorated with validation (same signature!)
    printf("4. With validation decorator:\n");
    Handler validated = create_validation_decorator(hello_handler, 5);
    
    char* result4a = validated("Bob");  // Too short
    printf("   %s\n", result4a);
    free(result4a);
    
    char* result4b = validated("Charlie");  // Valid
    printf("   %s\n\n", result4b);
    free(result4b);
    
    printf("=== Key Points ===\n");
    printf("✓ Function signature NEVER changed: char* (*Handler)(const char*)\n");
    printf("✓ Original functions work unchanged\n");
    printf("✓ Decorators add functionality without modifying originals\n");
    printf("✓ Can compose decorators (though this example keeps it simple)\n");
    printf("✓ 'Closures' implemented as structs + function pointers\n");
    printf("✓ Fixed segfault: static variables in different functions are separate!\n");
    
    return 0;
}
