#include <stdio.h>
#include <mach/mach.h>
#include <mach/vm_map.h>

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

int main(void){
    demonstrate_vm_allocate();
}
