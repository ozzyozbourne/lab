use std::{any::type_name, thread};

fn main() {
    let h1 = thread::spawn(f);
    let h2 = thread::spawn(f);
    let (id, id1, id2) = (thread::current().id(), h1.thread().id(), h2.thread().id());

    println!("Hello from the main thread! My id {id:?}");

    match h1.join() {
        Ok(()) => println!("Thread with id {id1:?} is completed "),
        Err(p) => println!("Thread with id {id1:?} panic with error -> {p:?}"),
    }

    match h2.join() {
        Ok(()) => println!("Thread with id {id2:?} is completed "),
        Err(p) => println!("Thread with id {id2:?} panic with error -> {p:?}"),
    }

    let numbers = vec![1, 2, 3];
    let h3 = thread::spawn(move || {
        let (l, mut sum) = (numbers.len(), 0);
        for n in numbers {
            sum += n;
        }
        sum / l
    });

    match h3.join() {
        Ok(v) => println!("Success the average is -> {v}"),
        Err(p) => println!("Error is -> {p:?}"),
    }

    let numbers2 = Vec::from_iter(0..=1000);

    let t = thread::spawn(|| {
        let len = numbers2.len();
        let sum = numbers2.into_iter().sum::<usize>();
        sum / len
    });

    match t.join() {
        Ok(v) => println!("the average number is {v}"),
        Err(e) => println!("Error -> {e:?}"),
    }
    // so the closure in rust can automatically move a variable
    // if we do some thing that need ownership of the variable
    //

    let numbers3 = vec![1, 2, 3];
    fn type_of<T>(_: &T) -> &'static str {
        type_name::<T>()
    }
    // so in the scope the we have the ownership of the number3 value
    thread::scope(|s| {
        s.spawn(|| {
            println!("length: {}", numbers3.len());
            println!("Type inside closure: {}", type_of(&numbers3));
        });

        s.spawn(|| {
            for n in numbers3.iter() {
                println!("{n}");
            }
        });
    });

    println!("testing -> {}", numbers3.len());
    checker();
    checker2();
    checker3();
    checker4();
    checker5();
}

fn f() {
    println!(
        "Hello from another thread! My is {:?}",
        thread::current().id()
    );
}

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        return x;
    }
    y
}

fn checker() {
    #[derive(Debug)]
    struct Point<'a> {
        x: &'a i32,
        y: &'a i32,
    }

    let x = 100;
    let y = 200;
    let p = Point { x: &x, y: &y };
    println!("{p:?}");
}

fn checker2() {
    #[derive(Debug)]
    struct Num {
        x: i32,
    }

    impl Num {
        fn compare<'a>(&'a self, other: &'a Self) -> &'a Self {
            if self.x > other.x {
                return self;
            }
            other
        }
    }

    let num = Num { x: 3 };
    let other = &num;

    println!("{:?}", num.compare(other))
}

fn checker3() {
    use std::fmt::Display;

    #[derive(Debug)]
    struct Movie<'a, T> {
        title: &'a str,
        rating: T,
    }

    impl<'a, T: 'a + Display + PartialOrd> Movie<'a, T> {
        fn new(title: &'a str, rating: T) -> Self {
            Movie { title, rating }
        }
    }

    let movie = Movie::new("The Crippler", 9.3);
    println!("{movie:#?}");
}

fn checker4() {
    #[derive(Debug)]
    struct Movie<'a> {
        title: &'a str,
        rating: u8,
    }

    #[derive(Debug)]
    struct Reviewer<'a, 'b: 'a> {
        movie: &'a Movie<'b>,
        name: &'a str,
    }
}

fn checker5() {
    fn chinchecker<'a>(c: &'a Box<i32>, b: &'a Box<i32>) -> &'a Box<i32> {
        c
    }

    let (a, b) = (Box::new(1), Box::new(2));
    let c = chinchecker(&a, &b);
    println!("{}", *c);
}

fn checker6() {
    fn next_language<'a>(languages: &'a [String], current: &str) -> &'a str {
        for lang in languages {
            if lang == current {
                return lang;
            }
        }
        languages.last().unwrap()
    }
}
