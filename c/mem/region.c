#include <mach/mach.h>
#include <mach/vm_map.h>

// Process 1: Create and share memory
void create_shared_memory() {
    vm_address_t address = 0;
    vm_size_t size = 4096;  // One page
    
    // Allocate memory in this task
    kern_return_t kr = vm_allocate(mach_task_self(), 
                                  &address, 
                                  size, 
                                  VM_FLAGS_ANYWHERE);
    
    if (kr == KERN_SUCCESS) {
        // Now we can share this memory with another process
        mach_port_t memory_object;
        
        // Create a memory object that represents this region
        kr = mach_make_memory_entry_64(mach_task_self(),
                                      &size,
                                      address,
                                      VM_PROT_READ | VM_PROT_WRITE,
                                      &memory_object,
                                      MACH_PORT_NULL);
        
        // This memory_object can now be passed to another process
        // via Mach IPC, allowing shared memory access
    }
}
