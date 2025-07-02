#include <stdio.h>

const char* get_string3(const char* const ch) { return "Hallo"; }

int main(void) {
    const char* (*ptr)(const char*);
    ptr = get_string3;
}
