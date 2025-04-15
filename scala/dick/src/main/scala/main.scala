package com.learn.udemy

@main
def main(): Unit =
  println("Hello world!")
  val div = try 10 / 0
  catch
    case _: ArithmeticException => 0
    case _: NullPointerException => 1
  finally println("du hast")
  println(div)

  var s = 0
  val res:Unit = while s < 20 do
    println(s)
    s += 1

  println(res == ())

