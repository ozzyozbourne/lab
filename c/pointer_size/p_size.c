#include <stdio.h>

int main() {
    printf("Size of void*:   %zu bytes\n", sizeof(void *));
    printf("Size of int*:    %zu bytes\n", sizeof(int *));
    printf("Size of char*:   %zu bytes\n", sizeof(char *));
    printf("Size of double*: %zu bytes\n", sizeof(double *));
    
    struct BigStruct { char data[1000]; };
    printf("Size of BigStruct*: %zu bytes\n", sizeof(struct BigStruct *));
    
    return 0;
}
