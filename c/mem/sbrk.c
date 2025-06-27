#include <unistd.h>
#include <stdio.h>

// malloc doesnt use sbrk() in macos anymore 
int main(void) {
    void *currentbreak = sbrk(0x5);
    printf("%p\n", currentbreak);

    currentbreak = sbrk(0);
    printf("%p\n", currentbreak);
}
