---
title: Surrounded by Slops: Cloud Red Teaming
date: 2026-10-04
topics: cloud-security, red-teaming, iam, opsec, aws, gcp, ai-slop
summary: On AI slop, Cloud IAM, OPSEC, attack graphs, and why knowing the command is not the same as knowing what the fuck you’re doing.
source: https://medium.com/@m0ab1d42/surrounded-by-slops-cloud-red-teaming-2bf8fff15425
---

*On AI slop, Cloud IAM, OPSEC, attack graphs, and why knowing the command is not the same as knowing what the fuck you’re doing.*

![Spider-Man looking at a device displaying No cap detected](./blog/surrounded-by-slops-cloud-red-teaming/01.jpg)

## TL;DR

- Me venting because of all the slop we see today
- The “too much of everything” problem
- Welcome to the slop
- OPSEC safe? What does that even mean?
- Detection Engineering, or rather, the other side of the same coin
- IAM is not a feature
- IAM mentality
- AWS, or rather JSON, JSON all the way down
- GCP, inheritance goes BRRRR
- IAM’s limitation
- The Seven Questions
- Conscious, not paranoid
- Automate the boring shit
- Attack graphs are better than command lists
- Where AWS and GCP Get Interesting
- Conclusion

Hello everyone, it's been a while since I wrote something that wasn’t somehow related to binaries, compilers doing cursed shit, or me staring at a debugger wondering why something that **SHOULD WORK** doesn't work.

This time, unfortunately, there is no .text section to extend.

There is something worse.

**Cloud IAM.**

But before I get into that, I want to highlight something that's been bugging me for a while now…

So, Today, almost anyone can wear the **“Expert”** hat.

You don’t necessarily need to understand the thing you are talking about.

You don’t even need to understand what you don’t understand.

You just need to be a sufficiently functional "**meat proxy" **between an** LLM **and a** terminal**.

Ask AI.

Copy answer.

Paste command.

Get error.

Paste error back.

Receive new command.

Repeat until something happens.

Congratulations.

You are now doing **“thecurity rethearch.”**

![Animated Patrick Star looking dazed and drooling](./blog/surrounded-by-slops-cloud-red-teaming/02.gif)

Well, that’s if you are actually at least doing the copy-pasting part.

Otherwise …

Let’s just keep it at the “otherwise” part :)

More than 300 years ago, Alexander Pope wrote in *An Essay on Criticism*:

> **“A little Learning is a dangrous Thing.”**

Which is honestly an incredible sentence to read in 2026.

Because holy shit, did we industrialize **a little learning????**

We can now manufacture it at scale.

You can know just enough Kubernetes to confidently destroy a cluster.

Just enough Active Directory to run every tool from your favorite awesome-pentest list.

Just enough AWS to know that IAM roles exist.

And just enough GCP to know that service accounts are probably important for some reason.

Uhhh…

Okay.

Anyways.

Cloud Security.

Yes, Cloud Security. I am supposed to talk about that!

![A small puppy looking worried](./blog/surrounded-by-slops-cloud-red-teaming/03.jpg)

So, over the last few months I spent quite some time researching cloud security, mainly AWS and GCP, from an offensive-security perspective.

And somewhere between IAM policies, service accounts, role assumptions, inherited permissions, temporary credentials, resource policies, annnnd twenty tabs of documentation contradicting the mental model I had created five minutes earlier, I realized something:

**Cloud red teaming has a tooling problem, but not the one people think it has.**

We have *too much* tooling.

Actually, we have **too much of everything**.

Tools.

Cheat sheets.

GitHub repositories.

Attack graphs.

AI-generated one-liners.

LinkedIn posts telling you that AdministratorAccess is dangerous.

Thanks bro. Very useful

![An animated man looking worried and confused](./blog/surrounded-by-slops-cloud-red-teaming/04.jpg)

And now, with LLMs being inserted into basically everything, we have entered a beautiful era where you can ask:

> *“How do I enumerate AWS?”*

and receive 74 commands, 16 tools, **gazillion** **Claude skills**, three outdated GitHub repositories, two hallucinated API calls, and probably a recommendation to run everything recursively with maximum privileges.

Wonderful.

This works amazingly well if your methodology is:

> **fuck around and find out.**

Unfortunately, real red teaming doesn’t work like that.

Or, better said:

It *shouldn’t*.

## Welcome to the Slop

AI has done something interesting to security research.

It made information ridiculously accessible while simultaneously making it much easier to consume information without understanding any of it.

You don’t need to understand IAM.

Just ask the model.

You don’t need to understand why a role can assume another role.

Just paste the policy.

You don’t need to understand which API calls modify state.

Just ask for “the command.”

And when it fails?

Paste the error back.

Repeat until root.

Basically reinforcement learning, but you are the meat proxy.

The problem is that red teaming is almost exactly the wrong field for this mentality.

When you’re reversing a binary in your own lab and crash it 300 times, nobody cares.

When you’re doing cloud red teaming against a production organization and randomly execute 300 API calls because some AI-generated checklist told you to…

**well :)**

Cloud environments are not CTFs.

Behind that cute little API endpoint might be:

- a production workload,
- an alerting rule,
- an automation pipeline,
- a permission boundary,
- an organization-level restriction,
- a SOC analyst drinking their fourth coffee [I see your struggles guys :\*( ]
- or all of them simultaneously.

And this is why I think the most important cloud red teaming skill isn’t remembering commands.

> **It is knowing what question you’re trying to answer before executing anything.**

That distinction sounds stupidly obvious.

But it is not.

![SpongeBob dismissing something as so boring](./blog/surrounded-by-slops-cloud-red-teaming/05.jpg)

## OPSEC Safe? What Does That Even Mean?

I have seen “OPSEC safe” being used to mean everything from:

> *“This command will not instantly get you detected.”*

to:

> *“The SOC will never see this.”*

Those are **VERY** different statements.

For me, an OPSEC-safe action during an authorized red-team engagement does **not** mean invisible.

Invisible is a dangerous word.

It means I understand, as far as reasonably possible:

- what I am touching,
- what state I am changing,
- what telemetry the action may generate,
- what systems may react to it,
- whether the action is necessary for the objective,
- and what the blast radius is if my assumption is wrong.

Basically:

> **OPSEC is not about doing nothing.
> It is about not doing stupid shit accidentally.**

![A man tapping his temple knowingly](./blog/surrounded-by-slops-cloud-red-teaming/06.jpg)

If I need to validate whether an identity can modify IAM, that doesn’t necessarily mean my first move should be modifying IAM.

Maybe I can answer most of the question through policy analysis?

Maybe there is a read-only API that gives me enough information?

Maybe I can model the permission relationship locally?

Maybe the engagement requires actually exercising the privilege?

Those are four completely different situations.

The action should come **after** the question.

Not before it.

## Detection Engineering, or Rather the Other Side of the Same Coin

This brings us to detection engineering.

A lot of offensive-security people think about detection like this:

**Detected = bad.**

That is way too simplistic.

Detection engineering is essentially the process of taking attacker behavior, identifying the telemetry that behavior produces, creating logic capable of recognizing it, and then continuously validating whether that logic actually works.

And if you’re doing red teaming properly, you are part of that validation loop.

Sometimes your objective is stealth.

Sometimes your objective is specifically to trigger the detection.

Sometimes your objective is to determine whether a supposedly dangerous sequence of actions creates useful telemetry at all.

Sometimes you want to know:

> *“Okay, the SOC detected that somebody changed the policy… but did they understand *why* that policy change mattered?”*

Because detection and understanding are also two different things.

A log entry saying:

PolicyUpdated

is not magically a detection.

Context turns telemetry into detection.

Who changed it?

Which identity?

What did the policy allow before?

What does it allow now?

Did the change create a path toward another identity?

Was that identity attached to a production workload?

Did another action happen immediately afterward?

**THAT** is where things become interesting.

And that is also why offensive security and detection engineering should not exist on two separate planets.

The attacker asks:

> *What can I do?*

The detection engineer asks:

> *What would it look like if somebody did it?*

**Same graph.
Different direction.**

![Kermit wondering what happened to the people who asked him for directions](./blog/surrounded-by-slops-cloud-red-teaming/07.jpg)

## IAM Is Not a Feature

Before talking about attacking IAM, we probably need to answer the annoying question:

**Why the hell does IAM exist in the first place?**

Cloud environments destroyed the old assumption that security boundaries were mostly network boundaries.

In a traditional environment, you might think:

> *This machine can reach that machine.*

In cloud environments tho, that question is often incomplete.

The more important question becomes:

> *Can ***this identity*** ask ***this service*** to perform ***this action*** against ***this resource***, under ***these conditions***?*

IAM exists because somebody has to answer that question.

Thousands.

Millions.

Sometimes billions of times.

Users need permissions.

Applications need permissions.

Virtual machines need permissions.

CI/CD pipelines need permissions.

Serverless functions need permissions.

Services need to talk to other services.

Organizations need centralized restrictions.

Temporary access needs to exist without somebody creating another static password and storing it in:

final\_credentials\_v2\_REAL\_NO\_CAP.txt

So IAM becomes the authorization fabric holding the environment together.

And because humans apparently enjoy suffering, every cloud provider implemented the same basic problem differently.

![A blue cap crossed out by a red prohibition symbol](./blog/surrounded-by-slops-cloud-red-teaming/08.webp)

## IAM Mentality

The mistake I made early in cloud security was thinking about IAM as a list of permissions.

Something like:

```text
Identity:
    read
    write
    delete
```

Cute, and yes, completely **useless**.

IAM is better understood as a **graph**.

You have identities.

You have resources.

You have policies.

You have trust relationships.

You have scopes.

You have conditions.

You have temporary identities.

You have services capable of acting using identities.

And then you have restrictions applied somewhere above everything else because apparently the graph wasn’t complicated enough already.

The interesting question therefore isn’t:

> *“Does this user have admin?”*

The interesting question is:

> **What can this identity eventually cause to happen?**

![A man grinning knowingly](./blog/surrounded-by-slops-cloud-red-teaming/09.jpg)

That word **eventually** changes everything.

Maybe I can’t access the secret.

But I can modify the function.

And the function has an identity.

And that identity can access the secret.

Interesting.

Maybe I cannot modify IAM.

But I can modify a deployment pipeline.

And the deployment pipeline runs as something much stronger than me.

Interesting.

Maybe I cannot become the privileged identity directly.

But I can influence something that can.

**VERY interesting.**

IAM paths are not always:

```text
me -> admin
```

They are more often:

```text
me
  -> something
      -> another something
          -> why the fuck does this have Owner?
```

## AWS, or Rather JSON, JSON All the Way Down

AWS has an extremely powerful IAM architecture.

And by powerful I also mean:

> **good luck building the complete mental model in your head.**

AWS can evaluate identity-based policies, resource-based policies, role trust policies, permission boundaries, session policies, and organization-level controls, among other policy mechanisms.

The same authorization decision can therefore depend on multiple layers simultaneously.

An identity might not appear privileged from its attached policy alone.

Then you discover that a resource policy trusts it.

Or that it can assume another role.

Or that a service can operate under a role.

Or that an explicit deny somewhere above destroys your beautiful attack graph.

AWS’s superpower is this flexibility.

The policy engine is **INSANELY** expressive.

I mean it literally!!!!!!

Cross-account access, temporary roles, granular conditions, service-specific resource policies…

You can build extremely sophisticated trust architectures.

Which naturally means you can also build extremely sophisticated **mistakes**.

Its biggest offensive-security headache is therefore also one of its biggest strengths:

> **authorization is distributed.**

The answer to:

> *“Can Alice access X?”*

might require looking at Alice, X, the account, the organization, a role trust relationship, a session context, and some condition keys before you can confidently answer.

> Alice left the chat.

So no, reading Alice's attached policy is not enough.

Of course it isn’t.

That would have been too easy.

## GCP, Inheritance Goes BRRRR

GCP feels different.

Instead of immediately drowning you in policy types, GCP gives you a resource hierarchy:

```text
Organization
    |
    +-- Folder
          |
          +-- Project
                |
                +-- Resources
```

Permissions can be granted higher in that hierarchy and inherited downward.

That is an extremely clean architectural idea.

It is also the reason that looking at one resource in isolation can give you a completely wrong picture of who actually has access to it.

GCP’s superpower is its hierarchy.

Organization-level controls can naturally apply downward, and projects form very meaningful organizational and security boundaries.

Then service accounts enter the room.

And suddenly identity relationships get spicy.

A principal may have permission to impersonate a service account.

That service account has its own permissions.

Another service account might be able to impersonate another one.

Workloads can run using service identities.

And now you’re back to building graphs again.

GCP service-account impersonation is conceptually similar to AWS role assumption: one authenticated principal can obtain short-lived credentials representing another identity when the required permissions exist.

So while AWS often makes me think:

> *“Which policies combine to authorize this request?”*

GCP often makes me think:

> *“Where in the hierarchy did this access come from, and which identity can become which other identity?”*

Different flavor.

Same headache.

![Two Spider-Men pointing at each other](./blog/surrounded-by-slops-cloud-red-teaming/10.webp)

## IAM’s Limitation

IAM is extremely powerful.

But IAM does not understand **intent**.

IAM doesn’t know:

> *“This developer should deploy applications but definitely shouldn’t be able to turn the deployment mechanism into a privilege-escalation path.”*

IAM understands permissions.

That distinction matters.

A permission that appears harmless alone might become dangerous when combined with another permission.

This is the classical composability problem.

Imagine three permissions (A, B, C)

Individually?

Boring.

Together?

**Admin with extra steps.**

This is why cloud privilege escalation is so interesting.

You often aren’t looking for AdministratorAccess.

You are looking for **capabilities that compose**.

And that leads to the mental model I now prefer using.

## The Seven Questions

Instead of starting with tools, commands, or giant checklists, I start with seven questions.

Every question creates the next branch of the attack graph.

## 1. Who Am I?

![A boy asking Wait a minute, who are you?](./blog/surrounded-by-slops-cloud-red-teaming/11.jpg)

Yes, seriously.

Before doing anything:

**What identity am I actually operating as?**

Human user?

Federated user?

Role session?

Service account?

Workload identity?

Temporary credential?

Some cursed CI/CD token that everybody forgot existed three years ago?

And equally important:

**What is the scope of that identity?**

Because misunderstanding your starting identity means every conclusion afterward might be garbage.

So…

Garbage in, attack gra…

Obviously garbage out!

## 2. What Can I Reach Without Changing Anything?

![Superintendent Chalmers asking Principal Skinner what is happening in there](./blog/surrounded-by-slops-cloud-red-teaming/12.jpg)

Before trying privilege escalation, ask what already exists.

What resources can I enumerate?

Which services answer me?

Which metadata can I read?

Which IAM relationships are visible?

Which projects/accounts are reachable?

Which workloads expose configuration I am legitimately authorized to inspect during the engagement?

This phase is extremely important because read-only information helps build the graph without immediately turning your engagement into a fireworks show.

You are trying to understand the environment.

Not speedrun the incident-response process.

## 3. Can I Reach Another Identity From My Identity?

This is probably my favorite question.

Because cloud environments are full of identity transitions.

In AWS:

> *Can this identity assume another role?*

In GCP:

> *Can this principal impersonate another service account?*

But don’t stop at direct transitions.

Ask whether you control something that **uses** another identity.

A workload.

A function.

A deployment mechanism.

An automation service.

The real relationship might not be:

```text
Identity A -> Identity B
```

It might be:

```text
Identity A
    -> modifies Resource X
        -> Resource X executes as Identity B
```

Remember the IAM mentality we talked about earlier!

**THAT is an IAM relationship too.**

The provider might not draw it for you.

Unfortunately, nobody promised the attack graph would be pretty.

## 4. Can I Change the Authorization Graph?

![Woody and Buzz Lightyear: It is all can Is but no am Is](./blog/surrounded-by-slops-cloud-red-teaming/13.webp)

Can I:

- modify an IAM policy?
- change a role binding?
- modify a trust relationship?
- attach an existing policy?
- change who can impersonate an identity?
- alter which identity a workload runs as?

This question is different from:

> *“Am I admin?”*

You might not be admin.

But if you can change the graph, you may be able to create a path that didn’t previously exist.

The dangerous part of IAM write permissions isn’t merely that something changes.

It is that **relationships change**.

And relationships are where privilege lives.

## 5. Can I Create New Credentials or Durable Access?

![Persistence poster showing a runner chasing another runner at sunset](./blog/surrounded-by-slops-cloud-red-teaming/14.jpg)

Assume your current access disappears.

Then what?

Could the identity legitimately create another credential within the engagement scope?

Could access be delegated?

Could a long-lived identity or key be created?

Could a workload identity relationship be changed in a way that survives the original session?

This is the persistence question.

And this is exactly where you need to stop pretending red teaming is a CTF.

Just because a capability exists doesn’t mean you instantly exercise it.

Persistence actions change state.

State changes have consequences.

The correct test might be proving the permission exists.

Or using an agreed test identity.

Or exercising it in a controlled environment.

The capability is what matters.

Not your ability to leave garbage behind.

## 6. Can I Cross a Boundary?

![A tree growing outside the wooden support built around it](./blog/surrounded-by-slops-cloud-red-teaming/15.webp)

Cloud architectures have boundaries everywhere.

Accounts.

Projects.

Folders.

Organizations.

Environments.

Networks.

Services.

Workloads.

Tenants.

Ask:

> **If I compromise this identity, where does the trust extend?**

Can production trust something from development?

Can one project influence another?

Can a deployment identity cross environments?

Does a shared service introduce a path nobody considered?

Can one workload cause another workload with stronger permissions to do something?

This is lateral movement, but cloud lateral movement often doesn’t look like:

```text
ssh machine1
ssh machine2
```

Sometimes lateral movement is literally one API request changing **who is allowed to ask another API request**.

YES.

Welcome to cloud, bruh!

## 7. What Will the Defender See?

![A man telling an interviewer he is blind in his left eye and 43 percent blind in his right](./blog/surrounded-by-slops-cloud-red-teaming/16.webp)

This question should exist **before** executing the action.

Not afterward.

What telemetry should exist?

Which system should record the action?

Would a control-plane event be generated?

Would the relevant service produce separate logs?

Would defenders see the source identity or only the resulting workload activity?

Would the action create an alert?

Should it?

**Can we afford the risk?**

And most importantly:

> **Is creating that telemetry part of the objective?**

Sometimes the answer is yes.

If you’re validating detection engineering, generating expected telemetry is not an OPSEC failure.

It is literally the test.

The mistake is generating noise you didn’t intend to generate and then calling it “adversary emulation”…

No shit…

## Conscious, Not Paranoid

This is the part that took me the longest to internalize.

If you become too aggressive:

You create unnecessary noise.

You modify things you didn’t need to modify.

You turn enumeration into exploitation for absolutely no reason.

You increase risk.

**AND**

If you become too paranoid:

You do nothing.

You spend six hours reading documentation trying to determine with mathematical certainty whether one API call might create an event somewhere.

At some point you have to test.

The goal is not:

> **NO NOISE.**

The goal is:

> **CONTROLLED NOISE.**

There is a huge difference.

A red-team operation should have a noise budget.

Not necessarily a literal spreadsheet saying:

```text
we have 17 API calls remaining
```

although that would be hilarious.

I mean a mental budget.

Every action should have a reason.

If a read-only query answers the question, use it, BUT not extensively; I will talk more about this in upcoming articles!

If policy analysis answers the question, analyze the policy.

If you need to modify something to validate the path, make the smallest agreed modification possible.

If the objective specifically includes testing SOC response, then stop pretending silence is success.

Make noise.

Deliberately.

A good red teamer should be capable of both.

That is the point.

## Automate the Boring Shit

Another thing AI slop bros get wrong is the idea that automation means:

> *“Automatically exploit everything.”*

Please don’t.

The best parts of cloud red teaming to automate are often the boring ones.

Collecting IAM relationships.

Normalizing policy documents.

Building identity graphs.

Mapping resources to identities.

Comparing effective permissions.

Finding interesting relationships.

Snapshotting state.

Generating evidence.

Diffing before and after a controlled test.

These tasks are deterministic.

They are repetitive.

Humans are terrible at them.

Perfect.

Automate them.

What I **DON’T** want fully automated is the decision:

> *“This looks exploitable, therefore execute it.”*

Because the tool doesn’t understand the engagement the way you do.

It doesn’t know whether this is production.

It doesn’t know whether modifying that service will restart something.

It doesn’t know whether the SOC is supposed to be blind or actively involved.

It doesn’t know whether the permission chain it discovered is an expected architecture pattern or an actual security issue.

So my preferred automation architecture looks something like:

```text
Collect
   |
Normalize
   |
Build Graph
   |
Identify Interesting Paths
   |
Explain Why They Matter
   |
  STOP <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
   |
Human Decision
   |
Controlled Validation
```

That **STOP** is extremely important.

> **Automation should make you faster at thinking.**

> **Not faster at (dkhol fel7ayt).**

## Attack Graphs Are Better Than Command Lists

This is also why I increasingly dislike cloud cheat sheets.

Don’t get me wrong.

They are useful.

I use them.

Everybody uses them.

The problem starts when the cheat sheet becomes the methodology.

A list saying:

```text
try A
try B
try C
try D
```

doesn’t explain why.

A graph does.

Imagine the following:

```text
Current Identity
      |
      v
Can modify workload configuration
      |
      v
Workload uses privileged identity
      |
      v
Privileged identity accesses sensitive resource
```

Now I have something meaningful.

I can reason about it.

I can ask which edges are real.

I can determine which edge needs validation.

I can ask what logs each transition creates.

I can discuss remediation.

I can explain the issue to someone who isn’t sitting next to me with a terminal.

That is infinitely more useful than:

> *“I ran tool X and it said HIGH.”*

**HIGH WHAT BRO, ARE YOU???**

## Where AWS and GCP Get Interesting

I realized midway through writing this that the article is already too long.

So…

I’ll write separate articles diving deeper into each provider, with practical examples and some interesting findings I figured out through my day-to-day work.

The important part is that the questions will stay the same.

The implementation won’t.

AWS will answer them one way.

GCP will answer them another.

Different architecture.

Different telemetry.

Different edge cases.

Different ways everything can go horribly wrong.

Fun :)

## Conclusion

AI makes it incredibly easy to generate answers.

Unfortunately, red teaming requires asking the correct questions.

That is the part I don’t think we should automate away.

When touching anything in the cloud, whether it is an AWS account, GCP project, Kubernetes cluster, Active Directory environment, or basically any system I don’t fully understand, I don’t want my first thought to be:

> *“Which tool should I run?”*

I want it to be:

```text
Who am I?
What can I reach?
Who can I become?
Can I change the authorization graph?
Can I create durable access?
Can I cross a boundary?
What will the defender see?
```

Then the **tools** can come.

Then the **automation** can come.

Then the **provider-specific tricks** can come.

And eventually the **weird findings** come too.

The interesting part of red teaming was never knowing the magic command.

It is building a model of the environment, finding the assumption somebody made, and asking:

> **What happens if that assumption is wrong?**

Because if your entire methodology is:

**fuck around and find out**

you will definitely find out.

The question is whether you learned anything before the SOC did.

Last but not least, stay curious, understand the graph, and please stop letting an LLM decide what you should execute in production…

or what you should have for lunch …

![A post joking about an AI assistant recommending a sandwich for lunch](./blog/surrounded-by-slops-cloud-red-teaming/17.jpg)

> This post and the article were both entirely human-written. AI was used to fact-check details and proofread only.

## References

1. Pope, Alexander. “[An Essay on Criticism: Part 2](https://www.poetryfoundation.org/poems/44897/an-essay-on-criticism-part-2).” Originally published in 1711.

2. Amazon Web Services. “[Policy evaluation logic.](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)” AWS Identity and Access Management User Guide.

3. Amazon Web Services. “[IAM roles.](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html)” AWS Identity and Access Management User Guide.

4. Amazon Web Services. “[Understanding CloudTrail events.](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-events.html)” AWS CloudTrail User Guide.

5. Google Cloud. “[About resource hierarchy.](https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy)” Resource Manager Documentation.

6. Google Cloud. [“Service account impersonation.](https://cloud.google.com/iam/docs/service-account-impersonation)” Identity and Access Management Documentation.

7. Google Cloud. “[Cloud Audit Logs overview.](https://cloud.google.com/logging/docs/audit)” Cloud Logging Documentation.
