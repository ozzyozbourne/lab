import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

// Simple flow builder with real kotlinx.coroutines.flow
fun simpleFlow(): Flow<Int> = flow {
    println("Emitting 1")
    emit(1)
    delay(100)  // Real suspension with delay
    println("Emitting 2")
    emit(2)
    delay(100)
    println("Emitting 3")
    emit(3)
}

// Flow with transformation operators
suspend fun flowWithOperators() {
    simpleFlow()
        .map { it * 10 }
        .filter { it > 15 }
        .collect { value ->
            println("Collected: $value")
            delay(50)
        }
}

// Entry point using runBlocking
fun main() = runBlocking {
    println("Starting flow...")
    flowWithOperators()
    println("Flow completed!")
}
