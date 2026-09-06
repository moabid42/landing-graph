---
title: C from another Prespective
date: 2023-03-27
topics: coding-conventions, c
summary: How I actually write C — the conventions, habits, and safety rules that keep the code readable and sane.
source: https://medium.com/@m0ab1d42/c-from-another-prespective-dc33462be53b
---

### C from another Perspective

With this I am starting an/series of articale/s, where I am gonna be explaining my own C perspective, and what I mean by that, how I write actually C code (which was inspired by my friend **enijakow,** he should take the credit for that ngl**: D)**.  
In this article, I am going to discuss the following :

- C conventions, and how they can help you write safer code.
- C details that beginners mostly miss.
- C limitations and how to overcome them.

#### **C conventions, and how they can help you write safer code**

Okay, okay if you did spend enough time writing C code, you would have come across many people complaining about how C is unsafe and how you should switch to Rust.  
Well to answer that I would step in and say that’s bullshit!  
C gives you the power over the machine, if you can’t write safe code that’s actually your fault not C’s fault, C is a tool and you are its master. It’s a language that allows you to configure and control the memory which is considered until this day the major strong point that C has.

However, to write safe C code, you need to follow some conventions. These conventions are not just there for the sake of aesthetics or standards, but they actually help you avoid common programming errors that can lead to security vulnerabilities or crashes. Here are some C conventions that you should follow (you better start using them after this 😒 ):

- **Use meaningful variable names and function names**: It’s important to use variable names that clearly indicate what the variable is used for. This will help you and other programmers understand the code and avoid errors that can result from confusion or misunderstanding.

```c
// First thing, I don't know why everyone is using structs like this :
typedef struct s_data {
  int   some_data;
  char  *some_more;
  // ...
} t_data;
// Instead of using it like this :
struct s_data {
  int   some_data;
  char  *some_more;
  // ...
};
// Yes you can use both the first one is simply using typedef to
// access struct s_data while only writing t_data instead of writing
// struct s_data. I mean yeah you are probably using it,
```

**A quick explanation of what is a typedef:**

Typedef is simpling creating an alias for the name.  
In general, an alias is a different name given to something that already has a name. In the context of coding, an alias is a way to give a shorter or more convenient name to a longer or more complex name.  
Here is a dummy example :

```c
typedef int mysuperbeautifulint;

mysuperbeautifulint var;

printf("The size of int = [%d] and the size of mysuperbeautifulint = [%d]\n", \
        sizeof(int), sizeof(mysuperbeatifulint);

// The size of int = [4] and the size of mysuperbeautifulint = [4]
```

From this example, we can see the size of the int and mysuperbeatifulint stayed the same.  
And now from this explanation, I think you have a better idea of what this t_data actually means. And now let's see why I don’t like this type of declaration.

Let's think of this scenario:

You have an application where you are using Struct, unions, and enums (If you don’t know what are those I am gonna leave some resources downstairs; ops I mean down below the article 🤓 ) at the same time, how are you gonna declare them? t_data, e_data, u_data ? Like this? If that is your approach good luck keeping your code readable and being able to differentiate between all of them 🙂.

```c
#include <stdio.h>

// define a struct named "Person"
typedef struct {
    char name[20];
    int age;
    enum e_gender { Male, Female } gender; // This is a boolean value, so
} t_person;                                // we don't really need an enum.

// define a union named "Number"
typedef union {
    int integer;
    float floating_point;
    char string[20];
} u_number;

int main() {
    // create a struct instance and initialize its members
    t_person person1 = {"John Doe", 25, Male};

    // create a union instance and assign a value to one of its members
    u_number num1;
    num1.integer = 10;

    // print the values of the struct and union instances
    printf("Name: %s, Age: %d, Gender: %d\n", person1.name, person1.age, person1.gender);
    printf("Integer: %d, Floating point: %f, String: %s\n", num1.integer, num1.floating_point, num1.string);

    return 0;
}
```

Or this :

```c
#include <stdio.h>

// define a struct named "Person"
struct s_person {
    char name[20];
    int age;
    enum e_gender { Male, Female } gender; // Here again, Male and Female,
};                                        // 1 and 0, boolean only.

// define a union named "Number"
union u_number {
    int integer;
    float floating_point;
    char string[20];
};

int main() {
    // create a struct instance and initialize its members
    struct s_person person1 = {"John Doe", 25, Male};

    // create a union instance and assign a value to one of its members
    union u_number num1;
    num1.integer = 10;

    // print the values of the struct and union instances
    printf("Name: %s, Age: %d, Gender: %d\n", person1.name, person1.age, person1.gender);
    printf("Integer: %d, Floating point: %f, String: %s\n", num1.integer, num1.floating_point, num1.string);

    return 0;
}
```

Don’t you think that when working on a huge and complex application, it’s gonna get messy? I like to visualize what I am doing, which part of the code does what, what this variable means, and what its purpose is. I don’t like spending time looking and trying to remember what was this var again: /  
Anyways, let's keep going! Now let's tackle the function naming conventions.

```c
// My way of writing code now (or better say Eric's way of writing code)
int main()
{
  struct s_data data; // You are convinced now right ? : )

// ----------------------
  data_create(&data);    // My code is devided into blocks and the moment
                         // i create smth I write immidiatly the destroy
    blablacodehere();    // to keep track of my memory and not have
                         // +1.5M leaks in the end and spend 2 months
                         // checking the leaks/double free/unconditional jumps ...
  data_destroy(&data);   // Just try it believe me.
// ----------------------
  return (0);
}
```

In addition of that if you read my function naming carefully you are gonna see that I build my function name like this :

```c
    data_create(&data);
    <---> <----->
/*
   Target_of_my_function      + _ +      The_action.        
(like struct or the object             (The action that 
this function is trying to            made by the function).
                    modify).
*/

/*
    In addition of that the first parameters is always the object this
       functinon is trying to change/read.
*/
```

Working with this methodology did spare me hours of debugging looking where are my memory leaks.

> What we have to fix is our behavior and how we write code, not the language :)

- **Write small and meaningful functions instead of huge no use ones**: Ofc this doesn’t apply to every case scenario but I try to use as many small and meaningful functions as possible as they provide a good layer of readability. (Yes I sometimes like that the norminette is 25 lines restricting).

```c
// This is the main of my implementation of the readelf command
// If you are interested in the hole source code, check this :
// https://github.com/moabid42/readelf
int main(int argc, char* argv[])
{
 struct elf_file elf;

 if (argc > 2 || argc == 1)
     usage(argv[0]);
// ------------------------------------ This is the first scope
 if (elf_file_create(&elf, argv[1]))
 {
     // ------------------------------- This is the second scope
     if (elf_file_magic_check(&elf))
     {
      // ----------------------------- And this is the last scope
       if (elf_file_version_64(&elf))
          elf_file_64_parse(&elf);
       else
          elf_file_32_parse(&elf);
      // ----------------------------- and here it ends the last scope
      }
     // ------------------------------ This is the end of the third scope
     // ------------------------------ This is the forth scope
      elf_file_destroy(&elf);
     // ------------------------------ This is the end of the forth scope
 }
// ---------------------------------- This is the end of the first scope
 return (0);
}
```

Even when using small functions like :

```c
// -------------------> I prefer writing this
bool  is_square_equal(int num, int compared_with)
{
  return (num * num == compared_with);
}

int ft_sqrt(int nb)
{
   int index;

   index = 0;
   if (nb < 0)
      return (0);
   while ((is_square_equal(index, nb) == false) && i <= 46340)
      index++;
   if (is_square_equal(index, nb) == true)
     return (index);
   return (0);
}
// -------------------> Instead of this
int ft_sqrt(int nb)
{
   int i;

   i = 0;
   if (nb < 0)
      return (0);
   while (nb != (i * i) && i <= 46340)
      i++;
   if (i * i == nb)
      return (i);
   return (0);
}
```

Ofc this is a simple example, so we can’t really see the real power of using this convention, but still through experience writing this simple and easy-to-read code, will not only make it much easier for even you to read your own code, yeah even you, I know many friends that struggle to understand their actual code (Kinda looks sus but yeah you got what I mean🧐).

***Note :***

You can always inline those functions if you are that concerned with speed. 🙂

- **Use const and static when appropriate**: Declaring variables as const can help prevent accidental modification of their value while declaring variables as static can help avoid namespace collisions and improve performance.

```c
const int MAX_SIZE = 100; // declaring a constant variable to avoid accidently
                          // changing it.
int main() {
   // code that uses MAX_SIZE
}
```

Using static can be tricky, I will let you discover how static variables work yourself, however for functions we mostly use them when we are using a function only locally and we don’t want to have any dependencies collisions (2 functions with the same name as an example in different files).

- **Check for errors**: Always check the return value of functions that can fail, and handle errors appropriately (Use exit only if it’s extremely needed, not everywhere, it’s a bad practice). This can help avoid crashes and security vulnerabilities.

#### C details that beginners mostly miss

There are some details in C that beginners often miss, which can lead to errors and frustration. Here are some important details to keep in mind:

- **Memory management**: C does not have automatic memory management like some other programming languages, which means that you need to manually allocate and free memory. Failure to do so can lead to memory leaks, crashes, and security vulnerabilities.

> Spend your time learning about memory, believe me, it’s worth it.

- **Pointers**: Pointers are a fundamental concept in C, but they can be confusing for beginners. It’s important to understand how pointers work and how to use them correctly to avoid errors.

> Pointers are your swords that will allow you to defeat compilation errors.

Let your goal be writing code that compiles from the first try (It’s an order, just do it 😤 , just kidding but yeah it hits differently believe me.) I don’t like spending hours fighting with a segfault and you as well, right?

- **String handling**: C strings are arrays of characters, and there are specific functions for manipulating them. It’s important to understand how these functions work and how to use them correctly to avoid buffer overflows and other errors.

One of the major concepts that beginners don’t understand is that a string can be read only and read and write.  
You are probably right now: Hmm what the hell does that even mean? 🤬  
Chill! Relax! I am gonna break it down.  
In C, a string is a sequence of characters (**“hello”** is **\[‘h’, ‘e’, ‘l’, ‘l’, ‘o’, ‘\0’\]** )that are stored in contiguous memory locations. When you declare a string in C, you can define it as either a constant read-only string or a read-and-write string.  
The main difference is that the read-only string will generate a segmentation fault, if you try to change any character in this sequence because this memory has been identified as read-only, so you can only read the value there, and not edit them. On the other hand, the read-write memory is a memory that allows you to edit any character in that sequence.

```c
char *my_name = stdup("mouad"); // Yeah that's my name
my_name[2] = 'r'
printf("My name is : %s\n", my_name);
// My name is morad
// Well you see someone changed my name now cuz my address wasn't read only :(
```

Another dummy example :

```c
char *read_only_string = "1dk wh4t sh0uld 1 s4y";
char *read_and_write_string = strdup("D0n't 3d1t m3 pl34s3");
```

My advice here experiment with them a little bit and try to edit the char index 0 in both cases and what you are gonna receive.

> We learn by doing, that how we escape the tutorial hell.

#### C limitations and how to overcome them

C is a powerful language, but it does have some limitations. Here are some common limitations and how to overcome them:

- Lack of built-in data structures: C does not have built-in data structures like arrays, linked lists, or hash tables. However, you can implement these data structures yourself or use a third-party library.

> C is your playground you can do whatever you want with it (Use abstraction to build anything you want, sky is your limit, or maybe not :)

- Lack of object-oriented features: C is not an object-oriented language, but you can use techniques like function pointers and structs to achieve some of the benefits of object-oriented programming. (What is object-oriented programming? I guess, it’s time to ask Chatgpt)

> Again use abstruction if you think of a struct as an object, it’s an object.

- Vulnerability to buffer overflows and other memory-related errors: As mentioned earlier, C requires manual memory management, which can lead to errors like buffer overflows. To overcome this, you can use safe coding practices like bounds checking and input validation. (Long story short check that you don’t access memory outside the allocated boundaries, and you don’t allow a user to access within the expected limits of the program, Binary exploits are scary but I am gonna explain them later, stay tuned !)

> If C gives you a sword, learn how to use it, don’t cut yourself with it. This much flexibility is a feature not a bug 🐛 .

Overall, C is a powerful language that gives you a lot of control over the machine, but it requires careful coding practices to avoid errors and security vulnerabilities. By following conventions, understanding important details, and overcoming limitations, you can write safe and effective C code.

#### Resources :

This Youtube Channel is Gold: https://www.youtube.com/watch?v=4OGMB4Fhh50&list=PLBlnK6fEyqRhX6r2uhhlubuF5QextdCSM  
I recommend watching as much as you can, but if you are looking for a specific topic, you can search for: name of the topic + neso academy (e.g pointers neso academy).  
Also this: https://www.youtube.com/watch?v=443UNeGrFoM&t=1544s

If you want more resources: **Google it!** That’s also part of the game**.**

---

*Originally published on [Medium](https://medium.com/@m0ab1d42/c-from-another-prespective-dc33462be53b).*
