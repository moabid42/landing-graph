---
title: Heap, The Witchcraft Dungeon
date: 2023-05-21
topics: binary-exploitation, gdb, heap, ctf, c
summary: How the glibc heap really works — chunks, bins, malloc/free — and how that turns into heap exploitation in CTFs.
source: https://medium.com/@m0ab1d42/heap-the-witchcraft-dungeon-ac08e782fb49
---

![The words "the Heap." set large in a serif typeface](./blog/heap-the-witchcraft-dungeon/01.webp)

As we ventured through the captivating realm of binaries, a treacherous dungeon named “The Heap” loomed before us. Bruh what is that ? He said, just a few moments later, and Hero named “GDB” pooped before us and said : “Fear not, my dear comrades, I am your trump card, follow me and I will lead you to the Boss Room”. We looked at him in confusion for a moment and then he said again: “Our ultimate triumph shall come in the form of conquering the Boss room and acquiring the glorious reverse shell!”. “Reverse shell, you say?” .“Indeed” he did say!

Hold on tight, folks, because this article is strictly for the daredevils out there — those who possess profound knowledge of memory layouts and a dash of understanding about the whimsical ways of malloc and free!

So, here’s the deal, folks. In this article, I’ll spill the beans about my triumph in the notorious Angstrom CTF 2023. Oh yes, the stakes were high, and my trusty partner-in-crime, [L3ak](https://ctftime.org/team/220336) (My CTF Team), was by my side as we tackled the mind-bending challenges. Brace yourselves as I walk you through my solution and unravel the secrets of this epic conquest.

![A wide-eyed woman clutching her fists, captioned "Oh my gosh... I'm so FREAKING excited!!!"](./blog/heap-the-witchcraft-dungeon/02.webp)

It was all about exploiting a sneaky heap overflow vulnerability.  
**Picture this:** two heap buffers, namely **buf1** and **buf2**, are allocated using malloc(). Now, here's the catch: while examining the decompiled code, we discovered that the first buffer, **buf1**, allowed us to input more data than its allocated size. **Lesson learned**, folks—never trust user input; always add those crucial checks and protections!

Now, in the second buffer, **buf2**, some random bytes are chilling out.  
**Our mission?** Guess the contents of **buf2** correctly. If we succeed, we're granted the power to write arbitrary data to **buf1** via the gets() function. And hold your breath—after that, free() is called on both buffers, and we dive right back into the fray for another round. Our task is to guess the contents of **buf2** correctly a whopping 100 times while keeping the heap metadata intact. Only then will we gain access to the coveted **flag.txt** file. Fail, and the program exits, leaving us empty-handed.

But here's the juicy part: the heap overflow in buf1 gives us the ability to overwrite the memory allocated for buf2 as well. So, by simply replacing buf2 with a fixed value during the overwrite, we can easily determine its contents when we're prompted to guess. However, there's a catch—we need to restore the overwritten metadata before the calls to free(). Those overwritten values are now garbage, thanks to our sneaky overwrite. Enter the gets() call, swooping in to fix the metadata, allowing free() to execute as intended. With each iteration, we repeat this process a hundred times, inching closer to that glorious flag.

**ARE YOU CONFUSED AND DIDN’T UNDERSTAND SHIT?**

Alright, gather ‘round and brace yourselves !  
When you fire it up, this enigmatic program has a peculiar way of operating. First, it prompts you for an input, then echoes that input back to you. But here’s the twist — it challenges you to guess a secret. If you get it wrong, it defiantly declares, “Wrong!” in your face.

Let’s dive into an example:

```bash
$ ./leek 
I dare you to leek my secret.
Your input (NO STACK BUFFER OVERFLOWS!!): AAAA
:skull::skull::skull: bro really said: AAAA
So? What's my secret? AAAA
Wrong!
```

Ah, did you catch that? The program proudly proclaims, “NO STACK BUFFER OVERFLOWS!!” as if dropping a hint that we’re dealing with a heap overflow situation here.

To shed light on this enigma, we turn to Ghidra (You should be familiar with this tool, if you did read my article about [**reverse engineering**](https://medium.com/@m0ab1d42/reversing-everything-except-love-27fe7a3d9e76)) and examine the decompiled code. Specifically, let’s take a peek at the main() function of the binary (shown below):

```c
void main(void)
{
  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  tVar2 = time((time_t *)0x0);
  srand((uint)tVar2);
  setbuf(stdout,(char *)0x0);
  setbuf(stdin,(char *)0x0);
  __rgid = getegid();
  setresgid(__rgid,__rgid,__rgid);
  puts("I dare you to leek my secret.");
  local_58 = 0;
  while( true ) {
    if (99 < local_58) {
      puts("Looks like you made it through.");
      win();
      if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
        __stack_chk_fail();
      }
      return;
    }
    buf1 = (char *)malloc(0x10);
    buf2 = (char *)malloc(0x20);
    memset(buf2,0,0x20);
    getrandom(buf2,0x20,0);
    for (local_54 = 0; local_54 < 0x20; local_54 = local_54 + 1) {
      if ((buf2[local_54] == '\0') || (buf2[local_54] == '\n')) {
        buf2[local_54] = '\x01';
      }
    }
    printf("Your input (NO STACK BUFFER OVERFLOWS!!): ");
    input(buf1);
    printf(":skull::skull::skull: bro really said: ");
    puts(buf1);
    printf("So? What\'s my secret? ");
    fgets(local_38,0x21,stdin);
    iVar1 = strncmp(buf2,local_38,0x20);  // < -- Here is the check
    if (iVar1 != 0) break;
    puts("Okay, I\'ll give you a reward for guessing it.");
    printf("Say what you want: ");
    gets(buf1);
    puts("Hmm... I changed my mind.");
    free(buf2);
    free(buf1);
    puts("Next round!");
    local_58 = local_58 + 1;
  }
  puts("Wrong!");
                    /* WARNING: Subroutine does not return */
  exit(-1);
}
```

Our mission is crystal clear: we need to call the formidable win() function and be kind enough so that it gives us the flag. The path to victory lies in passing the check in **line 13**, which will unlock the secrets of the flag for us.

Now, let’s take a closer look at the code that stands between us and our goal:

```c
void win(void)
{
  // Redacted
  
  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  __stream = fopen("flag.txt","r");
  if (__stream == (FILE *)0x0) {
    puts("Error: missing flag.txt.");
    exit(1);
  }
  fgets(local_98,0x80,__stream);
  puts(local_98);
  
  // Redacted
  return;
}
```

Within these sacred lines, we discover the heart of our quest. The code opens the “**flag.txt**” file and proudly displays the flag to the world.

But how do we navigate our way to this win()? Let’s explore further. In the realm of the main() function, we encounter two buffers — **buf1** and **buf2**. These brave buffers, allocated with sizes of **0x10** and **0x20** respectively, hold the key to our success. **Buf2** is bestowed with random bytes and.

Our journey continues as **buf1** is passed to the input() function, where the treacherous heap overflow vulnerability lies in wait. Feast your eyes upon the following excerpt:

```c
void input(void *buf1)
{
  // Redacted
  
  fgets(local_518,0x500,stdin);
  __n = strlen(local_518);
  memcpy(buf1,local_518,__n);
  
  // Redacted
  return;
}
```

This input() function, my fellow adventurers, is where our daring exploit takes shape. Observe as the function engulfs a whopping 0x500 bytes of input through fgets(), copying them mercilessly into buf1 using memcpy(). This very act of storing beyond the allocated space creates a powerful heap overflow, allowing us to overwrite the memory designated for other variables, such as the valiant **buf2**. Ah, the possibilities that lie within our grasp!

But wait, there’s more! Before we proceed, let me share a glimpse of the state of things, as witnessed through the eyes of GDB, just before the call to input(), but after **buf2** has been infused with those unpredictable random bytes:

![A gdb dump of the heap before the overflow, with buf1 and buf2 boxed and the top of the wilderness marked below them](./blog/heap-the-witchcraft-dungeon/03.webp)

When malloc() is called, it allocates not only the requested size but also some additional space for metadata. This ensures proper management of future allocations and the overall maintenance of the heap.

![Two allocated heap chunks, each a band of metadata around a user data block, with malloc's returned pointer landing on the user data](./blog/heap-the-witchcraft-dungeon/04.webp)

For our adventure in the land of 64-bit systems, the metadata size amounts to a noble 16 bytes. Additionally, each allocated block must align on a 16 or 32-byte boundary, known as the **alignment_prefix**. (I know I am getting a little be advanced here, but bear in mind, heap exploitation is considered an advanced topic even among the professionals)

Now, let us focus on the allocation of our valiant warriors, **buf1** and **buf2**. The requested sizes may be **0x10** and **0x20** respectively, but behold! The actual allocated sizes, considering the metadata and alignment, are **0x21** and **0x31**. Ah, the **PREV_IN_USE** bit, residing in the depths of the allocated chunk’s size, shines its light upon us. This bit indicates whether the previous block is allocated or not, hence bestowing upon us the sizes of 0x21 and 0x31 instead of the expected **0x20** and **0x30**.

But what is our grand objective, you ask? It is to overflow buf1 and gracefully write into buf2. By accomplishing this daring feat, when the inevitable question arises — what lies within buf2 at the prompt in line 35–37 of the main() function — we shall possess the knowledge to answer with unwavering certainty. We shall know what secrets we inscribed within **buf2**.

So, heed my words and imagine the scene. Our brave **buf1**, filled to the brim with 64 A’s (16 for **buf1** and 48 for **buf2**), overflows with power and purpose. And as we peer into the heap through the eyes of GDB, a glimpse of its transformed state unfolds before us. Prepare yourselves for a sight both captivating and enlightening!

![The same heap dump after the overflow, with buf1 and buf2 both filled with 0x41 bytes](./blog/heap-the-witchcraft-dungeon/05.webp)

Ah, the moment of triumph! **Buf2** stands adorned with a magnificent array of A’s, courtesy of our overflow. With this newfound power, we shall now conquer the check in line 38, allowing us to wield the full force of our input within **buf1** through the gets() function.

As the code unfolds, we witness a fascinating twist. The program, swayed by our successful guess, promises us a reward. The prompt eagerly awaits our desires as it invites us to speak our minds:

```c
// ...
if (iVar1 != 0) break;
puts("Okay, I'll give you a reward for guessing it.");
printf("Say what you want: ");
gets(buf1);
puts("Hmm... I changed my mind.");
free(buf2);
free(buf1);
puts("Next round!");
local_58 = local_58 + 1;
// ...
```

But hold on, fellow adventurers! We must exercise caution, for we cannot simply input anything we please. Doing so would surely result in a disastrous **CRASH** when the mighty free() is called. You see, free() relies upon the **SANITY** of malloc() metadata — the likes of **size**, **prev_in_use_bit**, and more — to execute flawlessly and maintain the sacred **freelist** (The real black magic of the heap exploits, where you find (**tcache poisoning**, **UAF …)**. Alas, our overflowing escapade has corrupted the heap metadata of **buf2**, spelling imminent doom for the program.

Fear not, for a solution awaits! We shall wield the power of gets() once again, strategically overflowing **buf1**, but this time with a noble purpose. We shall inscribe meaningful metadata into **buf2**, restoring the delicate balance of the heap. And what shall we write into buf2’s metadata, you ask? Why, it is simple! We shall rewrite what was once there, the esteemed size of **0x0000000000000031**. With a touch of artistry, we shall fill buf2 with B’s and restore the sacred size.

**TADAAAA:**

![The heap dump with buf1 filled with 0x42 bytes and a forged size field of 0x31 written into buf2's metadata](./blog/heap-the-witchcraft-dungeon/06.webp)

And so, the ritual continues, unfolding 100 times with unwavering determination. Free() gracefully executes, releasing the imprisoned warriors buf1 and buf2, allowing us to embark on yet another round of this intricate dance. The cycle repeats, each iteration bringing us closer to our ultimate goal.

With each passing repetition, our hearts beat in anticipation. The condition in line 13, the sentinel of our destiny, stands ready to unleash its truth upon us. And when that fateful moment arrives, when the condition turns true, the heavens themselves part ways, and win() is invoked.

> Now, We take our breath back, get the freaking flag, and get the points.

This challenge is a mere intro into the world of the Heap witchcraft, if you want to learn more about them, you can check this github repo where it explains different types of Heap exploits, in every libc version .

**Resources:  
1.** https://github.com/shellphish/how2heap  
**2.** If you are new here, this is a beginner friendly intro into the world of binary exploits : https://guyinatuxedo.github.io/00-intro/index.html

Thanks for reading ❤️

---

*Originally published on [Medium](https://medium.com/@m0ab1d42/heap-the-witchcraft-dungeon-ac08e782fb49).*
