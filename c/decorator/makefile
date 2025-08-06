TARGET = decorator_demo
SRCDIR = .
OBJDIR = obj
SOURCES = $(wildcard $(SRCDIR)/*.c)
OBJECTS = $(SOURCES:$(SRCDIR)/%.c=$(OBJDIR)/%.o)

CC = clang
CSTD = -std=c23

# Base compiler flags
BASE_CFLAGS = $(CSTD) -Wall -Wextra -Wpedantic -Wformat=2 -Wconversion \
              -Wshadow -Wstrict-prototypes -Wmissing-prototypes \
              -Wunreachable-code -Wunused -Wcast-qual -Wcast-align \
              -Wpointer-arith -Winit-self -Wfloat-equal -Wdouble-promotion \
              -Wnull-dereference -Wduplicated-cond -Wlogical-op \
              -Wshift-overflow=2 -Walloca -Wvla

# Security flags
SECURITY_FLAGS = -fstack-protector-strong -D_FORTIFY_SOURCE=2 \
                 -fPIE -Wl,-pie -Wl,-z,relro -Wl,-z,now

# Debug flags
DEBUG_FLAGS = -g3 -O0 -DDEBUG -fno-omit-frame-pointer \
              -fsanitize=address -fsanitize=undefined -fsanitize=leak \
              -fsanitize=integer -fsanitize=nullability

# Release flags  
RELEASE_FLAGS = -O3 -DNDEBUG -march=native -flto

# Analysis flags
ANALYSIS_FLAGS = --analyze -Xclang -analyzer-output=html \
                 -Xclang -analyzer-output-dir=analysis

# Paranoid flags (for maximum checking)
PARANOID_FLAGS = -Weverything -Wno-padded -Wno-declaration-after-statement \
                 -Wno-disabled-macro-expansion -Wno-format-nonliteral \
                 -Wno-unsafe-buffer-usage -Wno-switch-default \
                 -Wno-covered-switch-default -Wno-missing-variable-declarations

# Default build type
BUILD_TYPE ?= debug

# Set flags based on build type
ifeq ($(BUILD_TYPE),release)
    CFLAGS = $(BASE_CFLAGS) $(SECURITY_FLAGS) $(RELEASE_FLAGS)
    LDFLAGS = -flto
else ifeq ($(BUILD_TYPE),paranoid)
    CFLAGS = $(PARANOID_FLAGS) $(SECURITY_FLAGS) $(DEBUG_FLAGS)
    LDFLAGS = 
else
    # Default to debug
    CFLAGS = $(BASE_CFLAGS) $(SECURITY_FLAGS) $(DEBUG_FLAGS)
    LDFLAGS = 
endif

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

# =============================================================================
# Main targets
# =============================================================================

.PHONY: all clean debug release paranoid analyze test help install uninstall

# Default target
all: debug

# Debug build (default)
debug:
	@echo "$(BLUE)Building $(TARGET) in DEBUG mode...$(NC)"
	@$(MAKE) $(TARGET) BUILD_TYPE=debug

# Release build
release:
	@echo "$(GREEN)Building $(TARGET) in RELEASE mode...$(NC)"
	@$(MAKE) $(TARGET) BUILD_TYPE=release

# Paranoid build (maximum warnings)
paranoid:
	@echo "$(YELLOW)Building $(TARGET) in PARANOID mode...$(NC)"
	@$(MAKE) $(TARGET) BUILD_TYPE=paranoid

# Static analysis
analyze: clean
	@echo "$(BLUE)Running static analysis...$(NC)"
	@mkdir -p analysis
	$(CC) $(BASE_CFLAGS) $(ANALYSIS_FLAGS) $(SOURCES)
	@echo "$(GREEN)Analysis complete. Results in ./analysis/$(NC)"

# Main build rule
$(TARGET): $(OBJECTS)
	@echo "$(GREEN)Linking $(TARGET)...$(NC)"
	$(CC) $(OBJECTS) -o $@ $(LDFLAGS)
	@echo "$(GREEN)Build complete: $(TARGET)$(NC)"

# Object file compilation
$(OBJDIR)/%.o: $(SRCDIR)/%.c | $(OBJDIR)
	@echo "$(BLUE)Compiling $<...$(NC)"
	$(CC) $(CFLAGS) -c $< -o $@

# Create object directory
$(OBJDIR):
	@mkdir -p $(OBJDIR)

# =============================================================================
# Testing and utilities
# =============================================================================

# Run the program
run: $(TARGET)
	@echo "$(GREEN)Running $(TARGET)...$(NC)"
	@echo "================================"
	./$(TARGET)

# Test with different inputs
test: $(TARGET)
	@echo "$(BLUE)Running tests...$(NC)"
	@echo "Test 1: Normal execution"
	@echo "========================"
	./$(TARGET)
	@echo "\n$(BLUE)Test 2: Memory leak check$(NC)"
	@echo "============================"
	@if command -v valgrind >/dev/null 2>&1; then \
		valgrind --leak-check=full --show-leak-kinds=all ./$(TARGET); \
	else \
		echo "$(YELLOW)Valgrind not found, skipping memory check$(NC)"; \
	fi

# Check for memory leaks with AddressSanitizer
memcheck: debug
	@echo "$(BLUE)Running with AddressSanitizer...$(NC)"
	ASAN_OPTIONS=abort_on_error=1:check_initialization_order=1 ./$(TARGET)

# Generate assembly output
asm: $(SOURCES)
	@echo "$(BLUE)Generating assembly...$(NC)"
	$(CC) $(CFLAGS) -S -masm=intel $(SOURCES)
	@echo "$(GREEN)Assembly generated: *.s$(NC)"

# =============================================================================
# Installation and cleanup
# =============================================================================

# Install to system
install: release
	@echo "$(GREEN)Installing $(TARGET)...$(NC)"
	@install -D $(TARGET) /usr/local/bin/$(TARGET)
	@echo "$(GREEN)Installed to /usr/local/bin/$(TARGET)$(NC)"

# Uninstall from system
uninstall:
	@echo "$(RED)Uninstalling $(TARGET)...$(NC)"
	@rm -f /usr/local/bin/$(TARGET)
	@echo "$(GREEN)Uninstalled$(NC)"

# Clean build artifacts
clean:
	@echo "$(RED)Cleaning build artifacts...$(NC)"
	@rm -rf $(OBJDIR) $(TARGET) *.s analysis *.dSYM
	@echo "$(GREEN)Clean complete$(NC)"

# Deep clean (including backup files)
distclean: clean
	@echo "$(RED)Deep cleaning...$(NC)"
	@rm -f *~ *.bak *.tmp core core.*
	@echo "$(GREEN)Deep clean complete$(NC)"

# =============================================================================
# Information and help
# =============================================================================

# Show build information
info:
	@echo "$(BLUE)Build Configuration:$(NC)"
	@echo "  Target: $(TARGET)"
	@echo "  Compiler: $(CC)"
	@echo "  Standard: $(CSTD)"
	@echo "  Build Type: $(BUILD_TYPE)"
	@echo "  CFLAGS: $(CFLAGS)"
	@echo "  LDFLAGS: $(LDFLAGS)"
	@echo "  Sources: $(SOURCES)"
	@echo "  Objects: $(OBJECTS)"

# Show compiler version
version:
	@echo "$(BLUE)Compiler Information:$(NC)"
	@$(CC) --version

# Show help
help:
	@echo "$(BLUE)Available targets:$(NC)"
	@echo "  $(GREEN)all$(NC)       - Build debug version (default)"
	@echo "  $(GREEN)debug$(NC)     - Build with debug flags and sanitizers"
	@echo "  $(GREEN)release$(NC)   - Build optimized release version"
	@echo "  $(GREEN)paranoid$(NC)  - Build with maximum warnings"
	@echo "  $(GREEN)analyze$(NC)   - Run static analysis"
	@echo "  $(GREEN)run$(NC)       - Build and run the program"
	@echo "  $(GREEN)test$(NC)      - Run tests including memory checks"
	@echo "  $(GREEN)memcheck$(NC)  - Run with AddressSanitizer"
	@echo "  $(GREEN)asm$(NC)       - Generate assembly output"
	@echo "  $(GREEN)install$(NC)   - Install to /usr/local/bin"
	@echo "  $(GREEN)uninstall$(NC) - Remove from /usr/local/bin"
	@echo "  $(GREEN)clean$(NC)     - Remove build artifacts"
	@echo "  $(GREEN)distclean$(NC) - Deep clean including backups"
	@echo "  $(GREEN)info$(NC)      - Show build configuration"
	@echo "  $(GREEN)version$(NC)   - Show compiler version"
	@echo "  $(GREEN)help$(NC)      - Show this help"
	@echo ""
	@echo "$(BLUE)Examples:$(NC)"
	@echo "  make debug     # Build with debugging"
	@echo "  make release   # Build optimized version"
	@echo "  make paranoid  # Build with all warnings"
	@echo "  make run       # Build and run"
	@echo "  make test      # Run comprehensive tests"

# =============================================================================
# Dependencies
# =============================================================================

# Auto-generate dependencies
-include $(OBJECTS:.o=.d)

$(OBJDIR)/%.d: $(SRCDIR)/%.c | $(OBJDIR)
	@$(CC) $(CFLAGS) -MM -MT $(@:.d=.o) $< > $@
