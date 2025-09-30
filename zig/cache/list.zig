const std = @import("std");
const Allocator = std.mem.Allocator;

pub fn list(comptime T: type) type {
    return struct {
        head: ?*Node, 
        tail: ?*Node,
        mutex: std.Thread.Mutex,
        
        pub const Node = struct {
            value: T,
            prev: ?*Node = null,
            next: ?*Node = null,
        };

        const Self = @This();


    };
}



