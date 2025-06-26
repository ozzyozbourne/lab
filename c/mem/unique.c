#include <sys/mman.h>
#include <stdio.h>
#include <string.h>
#include <mach/mach.h>
#include <mach/vm_map.h>
#include <unistd.h>

void demonstrate_vm_allocate() {
    vm_address_t address = 0;
    vm_size_t size = 1024 * 1024;  // 1MB
    
    // Allocate virtual memory
    kern_return_t result = vm_allocate(mach_task_self(),  // Current process
                                      &address,            // Where to put it
                                      size,                // How much
                                      VM_FLAGS_ANYWHERE);  // Let kernel choose address
    if (result == KERN_SUCCESS) {
        printf("Allocated %lu bytes at %p\n", size, (void *)address);
        
        // Use the memory
        char *data = (char *)address;
        strcpy(data, "Hello from Mach!");
        
        // Deallocate when done
        vm_deallocate(mach_task_self(), address, size);
    }
}

void explore_memory_protection() {
    vm_address_t address = 0;
    vm_size_t size = 4096;  // One page
    
    // Allocate memory with read/write permissions
    kern_return_t kr = vm_allocate(mach_task_self(), 
                                  &address, 
                                  size, 
                                  VM_FLAGS_ANYWHERE);
    
    if (kr != KERN_SUCCESS) {
        printf("Failed to allocate memory\n");
        return;
    }
    
    printf("Allocated page at %p\n", (void *)address);
    
    // Write some data
    char *data = (char *)address;
    strcpy(data, "This memory is read/write");
    printf("Wrote: %s\n", data);
    
    // Now let's change the protection to read-only
    kr = vm_protect(mach_task_self(), 
                   address, 
                   size, 
                   FALSE,  // Don't set maximum protection
                   VM_PROT_READ);  // New protection: read-only
    
    if (kr == KERN_SUCCESS) {
        printf("\nChanged memory to read-only\n");
        printf("Can still read: %s\n", data);
        
        // This would crash if uncommented:
        // strcpy(data, "Try to write");  // CRASH! Memory is read-only
        
        printf("(Writing would cause a crash now)\n");
    }
    
    // Change it back to read/write
    kr = vm_protect(mach_task_self(), 
                   address, 
                   size, 
                   FALSE, 
                   VM_PROT_READ | VM_PROT_WRITE);
    
    if (kr == KERN_SUCCESS) {
        printf("\nChanged back to read/write\n");
        strcpy(data, "Now we can write again!");
        printf("Wrote: %s\n", data);
    }
    
    // Clean up
    vm_deallocate(mach_task_self(), address, size);
}

void compare_with_mmap() {
    printf("\n=== Comparing Mach vm_allocate with mmap ===\n");
    
    // Using mmap
    void *mmap_ptr = mmap(NULL, 4096, 
                         PROT_READ | PROT_WRITE, 
                         MAP_PRIVATE | MAP_ANONYMOUS, 
                         -1, 0);
    
    // Using vm_allocate
    vm_address_t vm_address = 0;
    vm_allocate(mach_task_self(), &vm_address, 4096, VM_FLAGS_ANYWHERE);
    
    printf("mmap returned:        %p\n", mmap_ptr);
    printf("vm_allocate returned: %p\n", (void *)vm_address);
    
    // Both can be used similarly
    strcpy((char *)mmap_ptr, "Hello from mmap");
    strcpy((char *)vm_address, "Hello from vm_allocate");
    
    printf("mmap data: %s\n", (char *)mmap_ptr);
    printf("vm_allocate data: %s\n", (char *)vm_address);
    
    // Clean up
    munmap(mmap_ptr, 4096);
    vm_deallocate(mach_task_self(), vm_address, 4096);
}

int main() {
    printf("=== Mach Virtual Memory Demo ===\n\n");
    
    demonstrate_vm_allocate();
    
    printf("\n");
    explore_memory_protection();
    
    printf("\n");
    compare_with_mmap();
    
    printf("\n=== All Done! ===\n");
    return 0;
}
