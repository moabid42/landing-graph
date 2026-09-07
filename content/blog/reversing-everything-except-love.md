---
title: Reverse everything except Love
date: 2023-05-08
topics: c, reverse-engineering, fairy-tale, programming
summary: A fairy-tale style intro to reverse engineering: from source to assembly and back, with the tools that make it click.
source: https://medium.com/@m0ab1d42/reversing-everything-except-love-27fe7a3d9e76
---

![A banner reading "The Art of Reversing"](./blog/reversing-everything-except-love/01.png)

Ah, **the wonders of the internet**! The vast digital playground where we’ve all innocently searched for those “totally legal” (Ehm) cracked software versions at least once, right? I mean, who wouldn’t want to save a few bucks while using these forbidden digital goodies? But did you know that behind our curious searches lies a fascinating technological sorcery known as reversing.

Yes, my fellow adventurers, reversing is the mystical art of understanding how a specific program works by employing mechanisms that could make even Merlin scratch his magical beard in confusion. It’s like solving a riddle wrapped in an enigma, tucked inside a digital labyrinth, with a side of cryptic puzzles just for kicks. Uh! I should stop this and get into the topic already 🤓.  
Have you ever been curious about how certain programs operate or wondered how people manage to find cracked software versions? Well, my friend, that’s where reversing comes into play. It allows us to delve into the mechanics of a specific program, examining its structure, logic, and behavior. It’s a journey of discovery, where we lift the veil on digital constructs and uncover the secrets they hold.

Oh, the joys of reversing! It’s like being a 🕵️ who can magically decipher the secrets of a program without even looking at its source code. Truly, a superpower only bestowed upon the chosen few!

So, your mischievous friend **Foo** thought he could outsmart you by handing you a mysterious C binary. But little does he know that you’re about to embark on an epic journey of reverse engineering. Get ready to do your virtual Sherlock Holmes hat and unleash your inner detective! 🔍

Now, imagine you have this binary file sitting innocently on your computer, teasing you with its enigmatic presence. You load it up, feeling the thrill of the unknown course through your veins. And voila! The program starts running, and asking you for secret code.

![A terminal running ./a.out, which asks who you are and demands the secret before it hands over its present](./blog/reversing-everything-except-love/02.png)

But fear not, you possess the mystical power of reversing! 😌 You scrutinize the output, analyzing it like a cryptographer examining an ancient scroll. Each line holds a clue, a piece of the puzzle that will unravel the program’s hidden secrets.

You might encounter strange function calls and memory addresses that appear as gibberish to the untrained eye. But fear not, intrepid explorer, for you shall uncover their true meaning! With a flick of your metaphorical magnifying glass, you trace the execution flow, step by step, until the fog of mystery begins to lift.

We are gonna see how in a minute, but first, we have to understand the lifecycle of a C program:

![A flow chart of the C build pipeline: source, preprocessing, compiler, assembler, linker with libraries, loader, and finally RAM](./blog/reversing-everything-except-love/03.png)

Ah, the fascinating journey of a C program! It goes through multiple phases, like a metamorphosis, until it finally emerges as an a.out file that your computer (or, as I like to call it, your obedient operating system) can comprehend. This a.out file is a special program containing something called machine code. Now, let me let you a little secret: machine code is not meant for human consumption. It’s like an alien language that only your computer understands. But fear not, my dear Watson, possess the extraordinary ability to crack this code!

Now, brace yourself for the real fun. Our adventure in reversing begins with the mystical realm of machine code. But wait, we’re not satisfied with stopping there! No, no, we’re daring detectives, always eager to go the extra mile. So, we take a step back and dive into the enchanting world of assembly language. Some might say that understanding assembly is enough to decipher the code’s intentions, but that’s just the language of non-humans (although I must confess, I’m somewhere in between, capable of understanding assembly but not faster than C 🤫).

Once we’ve waltzed through the intricate dance of assembly, a magical revelation awaits us. Behold, the holy grail of reversing: the decompiling stage! We transform the assembly back into C code, like a wizard summoning the original incantation. And fear not, my friend, we are not alone in this wizardry. There exists an abundance of tools, glorious tools, that can perform this sorcery on our behalf.

Ah, behold the treasures in our reverse engineering inventory! Let me introduce you to **Ghidra**, the chosen tool for today’s demonstration (though **IDA** or any decompiler can suffice if you fancy them). This magical contraption effortlessly reversed Foo’s beloved a.out binary, and voila! We have the source code back. Cool, huh?

![Ghidra showing the disassembly of a.out beside the decompiled C, where the input is compared against a hard-coded secret](./blog/reversing-everything-except-love/04.png)

But hold your excitement, my dear friend, for this is just a tiny pebble on our path. A basic program with a single function? Child’s play! Imagine the horror of reversing a desktop application with a thousand functions. That’s the ugly side of reversing, my friend. But fear not, we’re not ones to give up so easily!

Now, let’s switch gears and explore another perspective. Decompilers aren’t always the heroes we expect. Sometimes we need to call upon **gdb**, the noble debugger, to dissect the code step by step. But beware, for we’re trapped in the realm of machine instructions. It’s like trying to make sense of a dance routine by analyzing only the dancers’ movements. Quite the challenge, I must say, but we are ready for it !!!! 🤺

Our trusty first slash, “info functions,” reveals the enigmatic functions hidden within our binary. Now, let’s put our thinking caps on and ponder this profound question: which function shall we deem worthy of our reversing efforts? Ah, yes, the answer is clear! Let’s set our sights on that magnificent creature called “main” and bring it under our scrutinizing scope. Brace yourself, dear friend, for the unraveling of its secrets shall begin!

![pwndbg's info functions output, listing the symbols of the binary from _init to _fini with main at 0x11c9](./blog/reversing-everything-except-love/05.png)

Ladies and gentlemen, please take your seats, fasten your seat belts, and prepare for a mind-boggling disassembly extravaganza! We’re about to dive headfirst into the abyss of the “main” function, where the true mysteries lie. Hold on tight as we “**disass main”** and embark on an epic journey of unraveling the secrets that have eluded us thus far.

![pwndbg's disassembly of main, from the stack canary setup through scanf and strcmp to the two printf branches](./blog/reversing-everything-except-love/06.png)

behold the magnificent machine instructions that bring our humble a.out to life! Admit it, you’re utterly perplexed by this enigmatic language of aliens known as assembly. It looks scary, doesn’t it? But fear not, for the secrets it holds are worth uncovering. Now, I won’t dive too deep into the intricacies of assembly, but let me assure you, my friend, it’s really worth it.

Now, let’s close this chapter and open another. Decompiling a program isn’t always a Ghidra and gdb affair. It all depends on the language at hand. For example, you can use Dnspy for .NET programs or pycdc for Python bytecode, among other tools. The art of reversing lies in finding a way to transform that binary or bytecode into something understandable.

But heed my warning, dear friend. This journey is not meant to be a walk in the park. You’ll encounter plenty of obfuscation along the way, requiring intense concentration to make sense of it all. We can venture from the depths of binary files to the heights of websites. Yes, even JavaScript code can be reversed. Most JavaScript applications tend to obfuscate their logic, attempting to hide it from prying eyes. But fear not, for we are the reincarnations of Sherlock Holmes himself, remember? (Ehm)

So let us peer into this captivating realm and see what mysteries lie before us.

![Browser devtools open on a CTF page, showing a heavily obfuscated JavaScript file](./blog/reversing-everything-except-love/07.png)

(One of the challenges we solved in PWNME 2023)

Ah, the realm of obfuscated JavaScript. For that we must first embark on a quest to clean the easy functions, giving them meaningful names and unraveling their purpose. We test the functions with static returns,( using the **webdebugger**) tweaking and modifying them until they start making sense. Step by step, we untangle the web of obfuscation, until the JavaScript code begins to reveal its true intentions.

But let me make it clear, dear adventurer, that this introduction merely scratches the surface of this captivating topic. It serves as a brief glimpse into the realm of obfuscated JavaScript and the challenges it presents. The path forward is now in your hands. Dive into THE nothing, the sky isn’t your limit, uncover more knowledge, and delve deeper into the intricacies of this fascinating subject. The adventure awaits, my friend. Happy exploring!

**Resources :  
.** Nothing is better than writing program yourself, and reversing them yourself.  
. Reversing requires a lot of scripting, I would suggest learning these libraries after you get familiar with the concepts :  
- ***Pwntools***  
- ***Angr***  
- ***Z3***

> Reversing is a skill, unlike binary exploits and web exploits where you learn specific attack vectors, here just experience is a key and trying, trying and more trying is your only friend !!

You can really get into reverse engineering if you can’t do forward engineering (i.e. programming).  
Imagine Reversing like a bilding, you have first to understand how to reach it directly, if you understand, how going back won’t be a problem anymore.

> Having the curiosity to understand what is going on underneath is what you need in this field!

Thanks for reading ❤️  
Next topic: **The Heap (Between Advanced and Blackmagic)**

---

*Originally published on [Medium](https://medium.com/@m0ab1d42/reversing-everything-except-love-27fe7a3d9e76).*
