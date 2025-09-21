struct MyPair(Copyable):
    var first: Int
    var second: Int

    fn __init__(out self, first: Int, second: Int):
        self.first = first
        self.second = second

    fn __copyinit__(out self, existing: Self):
        self.first = existing.first
        self.second = existing.second

    # fn dump(self) -> Self: return self 
    def dump(self) -> Self: return self 

    # def dump(self) : print(self.first, self.second)

fn main(): 
    _= MyPair(1, 3).dump()

    


