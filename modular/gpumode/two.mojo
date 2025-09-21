trait SomeTrait:
    fn required_method(self, x: Int): ...

@fieldwise_init
struct SomeStruct(SomeTrait):
    fn required_method(self, x: Int): print("helle traits", x)

# so T is the type that has the trait so its 
fn fun_with_traits[T: SomeTrait](x: T): x.required_method(42)

fn main():
    var thing = SomeStruct()
    fun_with_traits(thing)
