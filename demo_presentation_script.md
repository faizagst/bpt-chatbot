# Demo Presentation Script: LENTERA Chatbot System

## Introduction (2 minutes)
**"Good morning everyone. Today, I am excited to present LENTERA, our AI-powered Responder Chatbot for BPT Komdigi."**

**"The problem we are solving is simple: How do we provide 24/7, accurate information to the public without overwhelming our staff? Standard chatbots often give generic or incorrect answers (hallucinations). Staff members get tired of answering the same questions about training programs over and over."**

**"Our solution is LENTERA. It uses a technology called RAG, or Retrieval-Augmented Generation. Instead of letting the AI guess the answer, we give it our official BPT Komdigi documents, and force the AI to answer *only* based on those documents. It's like giving an open-book exam to a very smart assistant."**

---

## Part 1: The User Experience (3 minutes)

*(Action: Open the public chatbot page `chatbot.domain.go.id`)*

**"Let's look at it from the public's point of view. A user visits our website and sees this floating icon. They open it, and they can immediately start asking questions."**

*(Action: Type a question like: "Bagaimana cara daftar pelatihan DTS?")*

**"I'll ask how to register for the DTS training. Look how fast it replies. You'll notice two things:"**
1. **"First, the answer is accurate and polite."**
2. **"Second, at the bottom, it shows exactly which document it used as the source. This guarantees trusted information."**

*(Action: Point to the quota pill at the top of the chat)*

**"To prevent abuse and control costs, we built a smart quota system. Users get 10 questions per session. If they run out, it shows a countdown timer. This is handled incredibly fast by our Redis cache."**

*(Action: Ask a question not related to BPT, like "Siapa presiden Amerika?")*

**"What if they ask something completely unrelated? The AI clearly states: 'Sorry, that information is not found in our official documents', and automatically shows a button to contact our WhatsApp support or Ticketing System. It's a safe, closed-loop system."**

---

## Part 2: The Administrator Experience (4 minutes)

*(Action: Open the admin panel at `chatbot.domain.go.id/admin` and login)*

**"Now, let's look at the brain behind the system. I'll log in to the secure Admin Dashboard. If our information changes, we don't need to write any new code. We just upload a new document."**

*(Action: Go to the 'Upload Dokumen' tab)*

**"Here, we can upload PDFs, Word documents, Excel files, and even Images. If you upload an image of a banner, our system uses Deep Learning OCR to read the text inside the image. The moment we upload it, the chatbot immediately knows the new information."**

*(Action: Switch to the 'Kelola Dokumen' tab)*

**"In the Manage Documents tab, we can see everything the AI knows. If a document is totally outdated, we just single-click delete, and the AI forgets it instantly."**

*(Action: Switch to the 'Analitik' tab)*

**"This is my favorite part: Analytics. We don't just answer questions; we learn from them. The system groups questions together by their meaning—not just keywords. So 'How to register' and 'Registration steps' are grouped into one cluster. We can instantly see the Top 10 most asked questions by the public. If there's a popular question we haven't answered, we know exactly what document to upload next."**

---

## Part 3: Architecture & Security Highlights (1 minute)

**"Before we end, a quick note on architecture. Everything you just saw is fully localized on our secure VPS using Docker."** 

**"When a user asks a question, the system checks our Redis cache. If someone asked the exact same thing an hour ago, it answers in milliseconds without even calling the AI. This saves us significant API costs."**

**"Our databases—MongoDB for logs and Qdrant for vector search—are locked down completely. They are only accessible internally, meaning zero exposure to the public internet."**

## Conclusion (1 minute)

**"In summary, LENTERA gives BPT Komdigi 24/7 public service, zero AI hallucinations, easy drag-and-drop document updates, and powerful analytics. It is production-ready."**

**"Thank you. I'm happy to answer any questions."**
