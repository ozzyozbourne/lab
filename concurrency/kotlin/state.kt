import kotlin.coroutines.*
import kotlin.coroutines.intrinsics.*

// Two dummy suspend functions for demonstration
suspend fun suspendFunction1(): Int {
    println("Running suspendFunction1()")
    return 10
}

suspend fun suspendFunction2(): Int {
    println("Running suspendFunction2()")
    return 20
}

// The coroutine we want to inspect
suspend fun example(): Int {
    val a = suspendFunction1()
    val b = suspendFunction2()
    return a + b
}

// Entry point using low-level coroutine API
fun main() {
    val continuation = object : Continuation<Int> {
        override val context: CoroutineContext = EmptyCoroutineContext
        override fun resumeWith(result: Result<Int>) {
            println("Coroutine completed with: ${result.getOrThrow()}")
        }
    }

    // ✅ Correct way — use function reference
    ::example.startCoroutine(continuation)
}
