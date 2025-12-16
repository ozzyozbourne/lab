#include <time.h>
#include <stdio.h>

int main(void){
    time_t a = time(NULL);        // Returns 1728230400, stores nowhere
    printf("%ld\n", (long)a);     // Prints: 1728230400

    time_t b;
    time(&b);                     // Returns 1728230400, stores in b
    printf("%ld\n", (long)b);     // Prints: 1728230400

    time_t c;
    b = time(&c);                 // Returns 1728230400, stores in c (twice!)
    printf("%ld %ld\n", (long)c, (long)b);     // Prints: 1728230400
}
