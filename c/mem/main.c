#include <sys/mman.h>
#include <stdio.h>
#include <unistd.h>

int main() {
    // This code works the same on macOS and Linux!
    size_t size = 1024 * 1024;  // 1MB
    
    void *memory = mmap(NULL, size,
                       PROT_READ | PROT_WRITE,
                       MAP_PRIVATE | MAP_ANONYMOUS,
                       -1, 0);
    
    if (memory == MAP_FAILED) {
        perror("mmap failed");
        return 1;
    }
    
    printf("Successfully mapped %zu bytes at %p\n", size, memory);
    
    // Use the memory
    char *data = (char *)memory;
    data[0] = 'H';
    data[1] = 'i';
    data[2] = '\0';
    printf("Wrote: %s\n", data);
    
    munmap(memory, size);
    return 0;
}
