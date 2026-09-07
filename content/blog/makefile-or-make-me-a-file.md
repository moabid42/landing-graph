---
title: Makefile or make me a file
date: 2023-03-30
topics: c, makefile, automation
summary: Makefiles from zero: rules, variables, pattern rules, and the tricks that make them useful beyond compiling C.
source: https://medium.com/@m0ab1d42/makefile-or-make-me-a-file-fca04a7bfcc2
---

Yep, today’s topic is Makefile—a taxi car that everyone uses, but only a few know how to use. But no worries, I got you! In this article, I will try to tackle the essence and bullet points of Makefiles and the absolute must thing you should know. Just get yourself a Coffee, relax and let's get started.

![](./blog/makefile-or-make-me-a-file/01.png)

Sooooo, in this article, I am going to tackle the following :

1.  What is a **Makefile,** and how does it work?
2.  Small tips and tricks, that you probably didn’t know about it.
3.  Makefile Samples.

## Makefile, what is this thing actually?

Well, I asked chatGPT and this is what it says :

```
A Makefile is a file used in software development to automate the process
of building executable programs or libraries from source code.

It contains a set of rules and dependencies that describe how to compile
the source code, link object files, and generate the final executable
or library.
```

Well I wouldn’t agree with everything there, so here is my definition:

```
A Makefile is basically a file used to automate a process that you can
manually do, it can be an executable, library... but not always (I will
provide down below some different types of use cases of Makefiles).
For example you can use makefile to set up a test, deploy and build of
your web application, it can be used to run your docker enviroment, so yeah,
it depends on what you want. Makefile is far more useful than just using
it to compile your C project.
```

Now I wanted to elaborate more regarding the second part of the definition.  
It says: **It contains a set of rules and dependencies that describe how to compile your code.  **
This part exactly is unclear, what do we mean by a rule right? Okay to answer this, let's take an easy example and dive into it.

```makefile
# ---------------------------------- The part is meant for variables
NAME    =  executable              
CFLAGS  =  -Wall -Wextra -Werror                    
CC      =  gcc

SCRS    =  file1.c file2.c
OBJS    =  $(SRCS:.c=.o)

# ----------------------------------- This part is meant for the rules 
all: $(NAME)                        
                                  
$(NAME): $(OBJS)
 gcc $(CFLAGS) -o $(NAME) $(OBJS)

%.o: %.c
 $(CC) $(CFLAGS) -o $@ -c $<

clean:
 rm -f $(OBJS)

fclean : clean
 rm -f $(NAME)

re : fclean all

.PHONY: all clean fclean re
```

If you have no idea what is going on there, no worries, we are just warming up, while getting to know first the structure of a makefile.  
The first thing you have to know, a makefile has its own special syntax called the makefile syntax (damn, I didn’t know that! Hehe what were you expecting, I am the only good one at choosing names 😌) which is in some sense similar to bash syntax, but yeah not entirely (even tho you can run bash commands inside a Makefile using: **\*\*\*\*\***, hehe why spoiling? I might dive into that later in this article, who knows? ). Anyways that was a small introduction, and now let's dive into these parts that make a Makefile:

## Variables:

Variables are just variables, yeah as simple as that! You initialize them using the equal operator =there is also another one :=but we are not going to tackle that in this article as it requires a good understanding of how bash handles variables expanding (I might write about bash later :^) ), if you are curious **Google is your friend** 😉.  
Anyways a simple way to declare a var is the following :

```makefile
NAME_OF_THE_VAR = value_of_the_var
```

Easy right?  
Now after we did declare our beautiful variable we need a way to use it right?  
Exactly, here is how:

```makefile
$(NAME_OF_THE_VAR)
// or you can use this :
${NAME_OF_THE_VAR}
// There is no actual difference (Build your own style of writing)
```

Also easy right? Damn, why am I saying “right” so many times? It’s annoying, right? Haha, just kidding : D  
Okay, I am gonna stop, let's get serious now.

## Rules

It’s a monster for most people somehow, even tho it’s super straightforward, in Englisch you define a rule, which means if you satisfy some conditions we are gonna run the following, as simple as that, you didn’t get it yet? It’s fine, let's dig a bit deeper into the structure of how to build a rule:

```
myamazingrulename: myamazingprerequisites
  myamazingcommand.  # In the manual they are naming this recipt
                     # but basically it's simply a bunsh of commands
                     # that you are trying to run
```

From this example, we understand that if we want to create a rule, we have to have 3 components :

**Rule name**: It is ***myamazingrulename*** which can be any name you define yourself, IT DOES NOT EXPLICITLY MEAN THAT YOU WANT TO GENERATE THIS FILE, but for readability purposes, we try to make the name of our rule, always the name of the file we are trying to generate, hint it’s not always the case. You didn’t fully understand? It’s fine, let's check some parts in our previous example:

```makefile
$(NAME) : $(OBJS)
 gcc $(CFLAGS) -o $(NAME) $(OBJS)
```

Don’t pay attention to other details, for now, let's just understand the rule okay? As you can see in this example we have a var as a rule name, first, let's dereference it. We get:

```makefile
executable: $(OBJS)
 gcc $(CFLAGS) -o $(NAME) $(OBJS) # If you don't understand why, it did became
                                  # like this, reread the previous full
                                  # makefile example
```

Okaaaaay, now it makes more sense, right? This rule, means exactly, like telling make file this: Hey makefile, can you please make me this file called executable, based on the receipt provided?

Haaa, make sense now, yeah? It means also in make syntax, something like this :

```bash
make executable
```

Note: that here we could have named the rule like this:

```makefile
potatoRule: $(OBJS)
 gcc $(CFLAGS) -o $(NAME) $(OBJS)
```

and running this rule will give the same output as the previous one, even though, if you want to run it, you should run it, like this:

```bash
make potatoRule # So only for readability purposes, we try to have a rule
                # name the same as the file we are asking make to generate.
```

I hope this became clear now. Now let's see one last example:

```makefile
fclean : clean
 rm -f $(NAME)
```

What is fclean here? The name of the file we are trying to generate? or just a random rule name? I’m not gonna answer that, I know for sure you know the answer already now. (Or else I am gonna kill you, just kidding, or maybe not 🙂). Next:

**Prerequisites**: It is smth like dependencies or conditions we need to satisfy before we can run our rule. Let’s see again an example:

```makefile
$(NAME) : $(OBJS)
 gcc $(CFLAGS) -o $(NAME) $(OBJS)
```

Soo, in this rule we have OBJSas a prerequisite, so basically it’s the same as saying, mister Makefile look, I know you are on a harry to run my command and generate my file, but wait for a second, check first if I have all the OBJS, if I don’t have them, look if there is another rule that generates them, if yes go generate them please and then come back here and try again to run my receipt (or command; myamazingcommand , you remember?)  
You are probably right now. What the heck man 😤??? How does the Makefile look if there is another rule that generates them or whatever? Listen, before processing your Makefile, the Makefile (Makefile, makefile so many makefiles 😵, I know my bad, but you get it) maps first all the rules, and then it starts processing the calling rule. So that when something is missing as a prerequisite, it immediately jumps to that rule and tries to generate it for us. In this case, by default, we don’t have OBJS in our folder, however, we had a rule that makes them.

```makefile
%.o: %.c
 $(CC) $(CFLAGS) -o $@ -c $<  # Again don't pay attention to the details
                              # I am going to tackle them soon
```

The %.o and %.c are called pattern rules, which match any file with the extension .o or .c, respectively, it’s so to say that this rule is translated into; based on our main Makefile example:

```makefile
file1.o: file1.c
 $(CC) $(CFLAGS) -o file1.o -c file1.c

file2.o: file2.c
 $(CC) $(CFLAGS) -o file2.o -c file2.c
```

Yes, the above rule using %.o and %.c does generate those 2 rules, pretty cool, huh? And now that we have finally our OBJS files generated the Makefile gonna jump back to :

```makefile
$(NAME) : $(OBJS)
 gcc $(CFLAGS) -o $(NAME) $(OBJS)
```

and tries to run again this is cool. Now after having OBJS we are allowed to run the receipt: gcc @(CFLAGS) -o \$(NAME)

And we are done 🥳 !!! That was a quick life cycle of simple rule execution.

## Tips or tricks, or probably both

- ***First tip***: Did you know that this thing is actually a predefined Makefile variable:

```makefile
$(NAME) : $(OBJS)
 gcc $(CFLAGS) -o $(NAME) $(OBJS)
^
|
# Yes that space there, by default, it's a tab, and you can change it,
# into potato, then your rule gonna become.
$(NAME) : $(OBJS)
potatogcc $(CFLAGS) -o $(NAME) $(OBJS)
# Haha looks funny right? but it's true you can change it, you can
# redefine the .RECIPEPREFIX variable in your Makefile to have the
# value "potato". For example, you can add the following line to
# the beginning of your Makefile:
.RECIPEPREFIX = potato
# If you don't believe me try it yourself lmao :^D
```

- ***Second tip:*** When you run make , It doesn't run the all rule, as everyone thinks, actually it runs the first rule in our makefile, taking again as an example our base example, running make, gonna trigger this :

```makefile
all: $(NAME)
```

Okay, let do a small change to our Makefile, and change it, into smth like this:

```makefile
# ---------------------------------- The part is meant for variables
NAME    =  executable              
CFLAGS  =  -Wall -Wextra -Werror                    
CC      =  gcc

SCRS    =  file1.c file2.c
OBJS    =  $(SRCS:.c=.o)

# ----------------------------------- This part is meant for the rules 
clean:
 rm -f $(OBJS)

all: $(NAME)                        
                                  
$(NAME): $(OBJS)
 gcc $(CFLAGS) -o $(NAME) $(OBJS)

%.o: %.c
 $(CC) $(CFLAGS) -o $@ -c $<

fclean : clean
 rm -f $(NAME)

re : fclean all

.PHONY: all clean fclean re
```

So, now what do you think the command make gonna do? If you did guess it right, well done, yes it’s gonna run the cleanrule, not the allrule. Cool huh? 🤫 , yeah I know, I am super cool 😌. (I feel embarrassed reading my own posts lmao, but that's how I explain to even people around me, so yeah that’s the **Me** !)

- ***The last tip***: Automatic variables

Boah 👻 are you scared? Haha, you are probably now, maaan what is that ??? Okay, chill! It’s something good that you asked this question.

In makefile, there are some predefined variables, called automatic variables, knowing some of them can be handy, I will try to simplify and shrink their manual definitions, but if you want to check to documentation’s definitions, check the link below.  
\$@

The file name of the target of the rule, basically the name of whichever rule name (or target) caused the rule’s recipe to be run.

In a previews example, we had:

```makefile
%.o: %.c
 $(CC) $(CFLAGS) -o $@ -c $<
```

Which means, the \$@ gonna be translated into whatever %.o is representing. If you fail lost go back and read again the part, where I was explaining the prerequisites.

\$\<

The name of the first prerequisite. Again let’s analyze the same example, we understand that \$\< gonna be translated into whatever %.c is representing.

Summary:

First step:

```makefile
%.o: %.c
 $(CC) $(CFLAGS) -o $@ -c $<
```

Second:

```makefile
file1.o: file1.c
 $(CC) $(CFLAGS) -o $@ -c $<

file1.o: file1.c
 $(CC) $(CFLAGS) -o $@ -c $<
```

Third and last step:

```makefile
file1.o: file1.c
 $(CC) $(CFLAGS) -o file1.o -c file1.c

file1.o: file1.c
 $(CC) $(CFLAGS) -o file2.o -c file2.c
```

To read more about automatic variables you can check the gnu manual, linked down below.

**Makefile Samples**

```makefile
# This is the makefile that I used in a project, which generates my
# own minimalistic shell, source code :
# https://github.com/moabid42/shell
NAME     = esh

SOURCES  = $(shell find . -name "*.c")
HEADERS  = $(shell find . -name "*.h")

OBJECTS  = $(patsubst %.c, %.o, $(SOURCES))
DEPENDS  = $(patsubst %.c, %.d, $(SOURCES))

CFLAGS   = -Werror -Wall -Wextra -Wall
RLFLAGS  = -lreadline

all: $(NAME)

%.o: %.c
 @$(CC) -Iincludes $(CFLAGS) -c $< -o $@

$(NAME): $(OBJECTS)
 @echo "Dependencies Compiled !"
 @$(CC) $(CFLAGS) $(RLFLAGS) $(OBJECTS) -o $(NAME)
 @echo "Compiled !"

clean:
 -@$(RM) $(OBJECTS) $(DEPENDS)
 -@$(RM) $(OBJECTS)
 @echo "Everything is Cleaned !"

fclean: clean
 -@$(RM) $(NAME)

run: all
 ./$(NAME)

re: clean all

.PHONY: re run fclean clean all
```

```makefile
# This Makefile generates a docker environment
# https://github.com/moabid42/inception
name = inception

all: 
 @printf "Launch configuration ${name}...\n"
 @docker-compose -f ./srcs/docker-compose.yml --env-file srcs/.env up -d

build:
 @printf "Building configuration ${name}...\n"
 @docker-compose -f ./srcs/docker-compose.yml --env-file srcs/.env up -d --build

down:
 @printf "Stopping configuration ${name}...\n"
 @docker-compose -f ./srcs/docker-compose.yml --env-file srcs/.env down

re: down
 @printf "Rebuild configuration ${name}...\n"
 @docker-compose -f ./srcs/docker-compose.yml --env-file srcs/.env up -d --build

fclean:
 @printf "Total clean of all configurations docker\n"
 @docker stop $$(docker ps -qa)
 @docker system prune --all --force --volumes
 @docker network prune --force
 @docker volume prune --force

.PHONY : all build down re fclean
```

```makefile
# This makefile generates and a serverless AWS pipeline
# Source code is private 
BACKEND_DIR = ./terraform/remote_state
TERRAFORM_ROOT = ./terraform

GREEN =\033[32m
RED  =\033[31m
RESET =\033[0m

deploy: require
 @if python3 main.py deploy; then \
  echo "Deployment succeeded!"; \
 else \
  echo "Deployment failed. You may have forgotten to set your credentials."; \
 fi

test:
 @if python3 main.py test; then \
  echo "Testing succeeded!"; \
 else \
  echo "Testing failed. You may have forgotten to set your credentials."; \
 fi

build:
 @if python3 main.py build; then \
  echo "Building succeeded!"; \
 else \
  echo "Building failed. You may have forgotten to set your credentials."; \
 fi

apply:
 @if python3 main.py apply; then \
  echo "Applying succeeded!"; \
 else \
  echo "Applying failed. You may have forgotten to set your credentials."; \
 fi

require:
 @pip install -r requirements.txt > /dev/null
 @echo "Requirements satisfied!"

terraform: backend
 @terraform -chdir=$(TERRAFORM_ROOT) init
 @terraform -chdir=$(TERRAFORM_ROOT) plan -out=tfplane
 @terraform -chdir=$(TERRAFORM_ROOT) apply tfplane

backend:
 @terraform -chdir=$(BACKEND_DIR) init && \
 @terraform -chdir=$(BACKEND_DIR) apply

help:
 # For work reasons I had to remove the help, as it provides an idea about
 # the code.

destroy:
 @terraform -chdir=$(TERRAFORM_ROOT) destroy

.PHONY: all deploy test build apply require terraform backend flcean
```

Before ending this article there is one line, that I didn’t want to explain on purpose(Hint: It starts with .PHONY, and it’s your turn to understand it and try to explain it to your left or right college (It’s another order, just do it 🙂, I am watching you;^D).

> This journey requires a lot of googling, try to build this curiosity, it’s gonna become your asset, believe me.

In the end, I wanted to thank you for reading and reaching the end! ❤️

**Resources**:  
https://www.gnu.org/software/make/manual/make.html#Rule-Introduction

---

*Originally published on [Medium](https://medium.com/@m0ab1d42/makefile-or-make-me-a-file-fca04a7bfcc2).*
