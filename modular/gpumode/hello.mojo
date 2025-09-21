# struct MyPair(Copyable):
#     var first: Int
#     var second: Int
#
#     fn __init__(out self, first: Int, second: Int):
#         self.first = first
#         self.second = second
#
#     fn __copyinit__(out self, existing: Self):
#         self.first = existing.first
#         self.second = existing.second
#
#     def dump(self):
#         print(self.first, self.second)

# fn main() raises:
#     var mine = MyPair(2, 4)
#     mine.dump()
#

@fieldwise_init
struct MyPair(Copyable, Movable):
    var first: Int
    var second: Int 

    def dump(self):
        print(self.first, self.second)

def main():
    var mine = MyPair(2, 4)
    mine.dump()

