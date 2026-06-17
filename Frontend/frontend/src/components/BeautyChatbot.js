import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaRobot, FaChevronDown } from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE BASE — keyword → response
// ─────────────────────────────────────────────────────────────────────────────
const KB = [
  // Greetings
  { keys: ['hello','hi','hey','good morning','good evening','howdy'],
    ans: "Hello! 👋 I'm Glow, your AI beauty assistant. Ask me anything about skincare routines, ingredients, skin concerns, or our spa services!" },
  { keys: ['how are you','how r u'],
    ans: "I'm glowing, thank you! 💜 How can I help your skin today?" },

  // Skin Types
  { keys: ['oily skin','oily face','shiny face','excess oil','sebum'],
    ans: "For **oily skin**: Use a foaming or gel cleanser, niacinamide 10% serum (controls sebum), oil-free moisturiser with hyaluronic acid, and a matte SPF 50. Avoid heavy creams and coconut oil. Exfoliate with BHA (salicylic acid 2%) 2–3× weekly." },
  { keys: ['dry skin','flaky skin','tight skin','dehydrated'],
    ans: "For **dry skin**: Use a creamy sulphate-free cleanser, apply hyaluronic acid serum on damp skin, layer with ceramide moisturiser, and finish with SPF 50. At night, use a rich sleeping mask or squalane oil. Avoid alcohol-based toners." },
  { keys: ['combination skin','t-zone','oily nose','dry cheeks'],
    ans: "For **combination skin**: Use a gentle gel cleanser, apply niacinamide to the T-zone and hyaluronic acid to dry areas. Use a lightweight, balanced moisturiser. Salicylic acid spot-treat for oily zones." },
  { keys: ['sensitive skin','redness','reactive skin','irritated'],
    ans: "For **sensitive skin**: Stick to fragrance-free, minimal-ingredient products. Use Centella Asiatica or Azelaic Acid 10% to calm redness. Avoid harsh exfoliants — try PHA instead of AHA. Always patch-test new products for 48 hours." },
  { keys: ['normal skin'],
    ans: "Lucky you with **normal skin**! 🌟 Focus on prevention: Vitamin C in the AM, SPF 50 daily, and a gentle retinol 0.3% twice weekly at night to maintain youthful skin long-term." },

  // Acne
  { keys: ['acne','pimple','breakout','blemish','zit','cystic'],
    ans: "For **acne**: Cleanse with salicylic acid face wash, apply benzoyl peroxide 2.5% spot treatment, and use niacinamide 10% serum. Never pop pimples! At night, use adapalene (retinoid) 3× weekly. Book our Advanced Acne Repair Facial for professional treatment." },
  { keys: ['blackhead','whitehead','clogged pore','congested'],
    ans: "For **blackheads**: BHA (Salicylic Acid 2%) is your best friend — use it 3× weekly. Clay masks help absorb excess oil. Avoid comedogenic (pore-clogging) ingredients like mineral oil. Try our Mattifying Deep Clean service for a professional extraction." },

  // Dark Spots & Pigmentation
  { keys: ['dark spot','pigmentation','hyperpigmentation','melasma','uneven tone','dark marks'],
    ans: "For **dark spots**: Use Vitamin C 15% serum every morning (AM only). Add niacinamide 10% for extra brightening. Sunscreen SPF 50 every day is NON-NEGOTIABLE — UV makes pigmentation worse. For stubborn spots, try our Kojic Brightening Peel service." },

  // Anti-Aging
  { keys: ['wrinkle','fine line','aging','anti-aging','anti ageing','collagen','firmness','sagging'],
    ans: "For **anti-aging**: Retinol 0.3% is the gold standard — start 2× weekly and build up. Add a peptide serum for collagen support. Hyaluronic acid plumps fine lines temporarily. Vitamin C + SPF in the AM prevents further damage. Try our Collagen Infusion Boost or RF Skin Tightening service." },

  // SPF / Sunscreen
  { keys: ['sunscreen','spf','sun protection','uv','sunblock'],
    ans: "**SPF is the single most important skincare step** — no exceptions! 🌞\n\n• Use SPF 50 PA++++ every morning, even indoors.\n• Reapply every 2 hours if outdoors.\n• Recommended: Re'equil Ultra-Matte SPF 50 or Dot & Key SPF Serum.\n• UV causes 80% of visible skin aging." },

  // Ingredients
  { keys: ['niacinamide'],
    ans: "**Niacinamide (Vitamin B3)**: Works for almost all skin types. Controls oil, minimises pores, fades dark spots, strengthens barrier. Use 10% concentration. Safe to mix with most actives. The Ordinary Niacinamide 10% is a great budget pick. Safety Score: 9.2/10." },
  { keys: ['hyaluronic acid','hyaluronic'],
    ans: "**Hyaluronic Acid**: A humectant that holds 1000× its weight in water. Apply to DAMP skin for best results, then seal with a moisturiser. Suitable for all skin types. Can layer under any serum or cream. Safety Score: 9.8/10." },
  { keys: ['retinol','retinoid','vitamin a','retin'],
    ans: "**Retinol**: The most scientifically proven anti-aging ingredient. Start with 0.3% twice weekly, build to 3×/week. Always use at night, follow with moisturiser, and ALWAYS wear SPF the next day. Expect 4–6 weeks before results. Watch for initial purging." },
  { keys: ['vitamin c','ascorbic acid','vit c'],
    ans: "**Vitamin C**: Best used in the morning for antioxidant protection against UV and pollution. Pair with Vitamin E and Ferulic Acid for maximum effect. Store in a dark place — it oxidises quickly. Minimalist Vitamin C 10% is great value." },
  { keys: ['salicylic acid','bha','beta hydroxy'],
    ans: "**Salicylic Acid (BHA 2%)**: Oil-soluble exfoliant that penetrates pores to clear blackheads and treat acne. Use 2–3× weekly, not daily. Best for oily/acne-prone skin. Avoid with retinol on the same night. Paula's Choice BHA Exfoliant is the gold standard." },
  { keys: ['aha','glycolic','lactic acid','alpha hydroxy'],
    ans: "**AHA (Glycolic/Lactic Acid)**: Water-soluble exfoliant for surface dead skin cells. Improves texture, tone, and brightness. Use 2× weekly at night. Always follow with SPF the next morning. Start at 5–8% if new to exfoliants." },
  { keys: ['ceramide'],
    ans: "**Ceramides**: Natural lipids that repair and strengthen the skin barrier. Essential for dry, sensitive, and eczema-prone skin. Best paired with hyaluronic acid and peptides. CeraVe products are the most well-known ceramide-based skincare." },
  { keys: ['peptide','peptides'],
    ans: "**Peptides**: Short chains of amino acids that signal the skin to produce more collagen. Great for firming and anti-aging without irritation. Safe to use daily and compatible with most actives, including retinol." },
  { keys: ['ingredient','ingredients','what to avoid','bad ingredient'],
    ans: "**Ingredients to avoid** for most skin types:\n• Denatured Alcohol (drying)\n• Synthetic Fragrance (irritating)\n• Sodium Lauryl Sulphate (harsh)\n• Parabens (preservative concern)\n• Mineral Oil (comedogenic)\n\nAlways check ingredient lists — our Ingredient Scanner can help!" },

  // Routine
  { keys: ['morning routine','am routine','routine morning','daily routine'],
    ans: "**Ideal AM Skincare Routine:**\n1️⃣ Gentle Cleanser (60 seconds)\n2️⃣ Hydrating Toner\n3️⃣ Vitamin C Serum\n4️⃣ Eye Cream (optional)\n5️⃣ Moisturiser\n6️⃣ SPF 50 — LAST step, every day." },
  { keys: ['night routine','pm routine','evening routine','nighttime'],
    ans: "**Ideal PM Skincare Routine:**\n1️⃣ Oil Cleanser (removes sunscreen + makeup)\n2️⃣ Foaming Cleanser (double cleanse)\n3️⃣ Toner\n4️⃣ Active Serum (Retinol / Niacinamide / AHA)\n5️⃣ Eye Cream\n6️⃣ Rich Night Moisturiser or Sleeping Mask." },
  { keys: ['routine','how to build','skincare routine','basic routine'],
    ans: "**Building a skincare routine:**\n🌅 AM: Cleanser → Toner → Vitamin C → Moisturiser → SPF\n🌙 PM: Double Cleanse → Toner → Treatment (Retinol/AHA) → Moisturiser\n\nStart with the basics, then add one active at a time. Use the Routine Builder in the sidebar for a personalized plan!" },

  // Products
  { keys: ['recommend product','best product','which product','product recommendation','suggest product'],
    ans: "Here are top-rated products from our catalog:\n\n🏆 **CeraVe Hydrating Cleanser** — Best for dry/normal skin\n🏆 **The Ordinary Niacinamide 10%** — Best for pores & oil\n🏆 **Minimalist Vitamin C 10%** — Best brightening serum\n🏆 **Re'equil Ultra-Matte SPF 50** — Best sunscreen for India\n🏆 **Neutrogena Hydro Boost Gel** — Best hydrating moisturiser\n\nVisit the Product Curations page for full details!" },
  { keys: ['budget','affordable','cheap','inexpensive','low cost'],
    ans: "**Best budget skincare picks:**\n• Cleanser: Cetaphil Gentle Cleanser (₹520)\n• Serum: The Ordinary Niacinamide 10% (₹650)\n• Moisturiser: Neutrogena Hydro Boost (₹950)\n• SPF: Re'equil Ultra-Matte SPF 50 (₹495)\n\nTotal routine under ₹2,700!" },
  { keys: ['luxury','high end','premium product','expensive'],
    ans: "**Premium skincare picks:**\n• 24K Gold Facial from our spa — ₹3,200 (Luxury anti-aging)\n• Paula's Choice BHA Exfoliant — ₹2,800\n• AquaPeel HydraFacial — ₹4,800\n• Collagen Infusion Boost treatment — ₹3,500\n\nFor a full premium package, check our Bridal Glow Essentials combo!" },

  // Services
  { keys: ['facial','best facial','facial recommendation','which facial'],
    ans: "Here are our most popular facials:\n\n✨ **Glass Skin Ritual** (₹4,200) — For glass-like luminosity\n✨ **AquaPeel HydraFacial** (₹4,800) — #1 for hydration\n✨ **24K Gold Facial** (₹3,200) — Luxury anti-aging\n✨ **Advanced Acne Repair** (₹1,800) — For breakout-prone skin\n\nBook via Spa Services in the sidebar!" },
  { keys: ['massage','body massage','relax','stress'],
    ans: "Our top massage treatments:\n\n💆 **Full Body Aromatherapy** (₹3,200 / 90 min) — Deep stress release\n💆 **Hot Stone Therapy** (₹3,800 / 75 min) — Dissolves muscle tension\n💆 **Swedish Relaxation Massage** (₹2,500 / 60 min) — Classic relaxation\n💆 **Foot Reflexology** (₹1,200 / 45 min) — Energy alignment\n\nBook from the Spa Services page!" },
  { keys: ['bridal','wedding','bride','groom'],
    ans: "For **brides & grooms** we recommend:\n\n👰 **Bridal Glow Essentials** (₹5,500) — Gold Facial + Body Polish + Mani-Pedi + HD Brows\n🤵 **Wedding Ready Groom** (₹4,500) — Gold Facial + Manicure + Pedicure + Hair Spa + Beard\n\nBook 4–6 weeks before the wedding date. Call us to reserve a bridal slot!" },
  { keys: ['book','appointment','booking','schedule','reserve'],
    ans: "To book an appointment:\n1. Go to **Spa Services** in the sidebar\n2. Browse our treatments (For Her / For Him)\n3. Click **Book** on any service card\n4. Enter your name, date & time slot\n5. Receive your booking reference instantly! 📅" },

  // Scan
  { keys: ['scan','ingredient scan','product scan','label scan','ocr'],
    ans: "Our **Ingredient Scanner** uses AI-powered OCR to read any product label!\n\n📸 Steps:\n1. Go to Ingredient Scan in the sidebar\n2. Upload a photo of the product label\n3. Get instant ingredient analysis + safety scores\n4. See which ingredients to celebrate and which to avoid!\n\nWorks completely offline — no internet needed after upload." },
  { keys: ['face analysis','face scan','analyze','analyse','face detect'],
    ans: "Our **AI Face Analysis** detects:\n• Skin tone & undertone\n• Seasonal colour type (Spring/Summer/Autumn/Winter)\n• Face shape (Oval, Round, Square, etc.)\n• Eye & hair colour\n• Estimated skin concerns\n\n📸 Go to Face Analysis in the sidebar. Use good lighting and a front-facing photo for best accuracy!" },

  // Skin concerns
  { keys: ['pore','large pore','open pore','pore size'],
    ans: "For **large pores**: Niacinamide 10% is the best daily treatment. BHA (Salicylic Acid 2%) clears pore congestion. Clay masks absorb excess oil. Avoid heavy creams that can enlarge pores. Try our Volcanic Ash Detox facial for a professional deep clean." },
  { keys: ['dark circle','under eye','eye bag','puffy eye'],
    ans: "For **dark circles + puffiness**: Use a caffeine eye serum in the morning to de-puff. Vitamin K + retinol eye creams reduce discolouration. Store eye cream in the fridge for extra de-puffing. Stay hydrated and sleep on your back." },
  { keys: ['tan','tanning','de-tan','sun tan','remove tan'],
    ans: "To **remove a tan**: Try our Charcoal De-Tan Facial (₹500) or Sun Damage Repair (₹1,600). At home, use a Vitamin C serum daily + SPF. A turmeric + honey mask 2× weekly can help. Results typically appear in 2–4 weeks." },

  // Hair
  { keys: ['hair','hair care','hair fall','dandruff','hair spa'],
    ans: "For **hair care**, we recommend:\n• Anti-Dandruff Treatment service (₹1,210)\n• Keratin Hair Spa (₹1,720) for frizzy hair\n• Use sulphate-free shampoo\n• Oil your scalp 1× weekly with argan or coconut oil\n• Check Hair Styling in our sidebar for more!" },

  // Nail
  { keys: ['nail','manicure','pedicure','nail art','gel nail'],
    ans: "Our **Nail Studio** offers:\n💅 Gel Nail Art (₹800) — Chip-free for 3 weeks\n💅 Japanese Gel Nail Extension (₹2,200) — Ultra-thin, glossy\n💅 Luxury Spa Mani-Pedi Combo (₹1,600) — Full pampering\n💅 Paraffin Pedicure (₹795) — For cracked heels\n\nVisit Spa Services → Nail & Hand Studio to book!" },

  // Weather
  { keys: ['weather','climate','monsoon','winter','summer','season','humidity'],
    ans: "Your **weather affects your skin** — we've built a live Weather Skin Tips widget!\n\n☀️ Summer: Lightweight SPF + antioxidants\n🌧️ Monsoon: Gel moisturiser + anti-fungal pedicure\n❄️ Winter: Rich ceramide cream + lip balm\n☁️ Overcast: Don't skip SPF — UV penetrates clouds!\n\nCheck your live tips on the Dashboard home page!" },

  // Report / PDF
  { keys: ['report','pdf','download report','beauty report'],
    ans: "You can download your personalised **PDF Beauty Report** from the Dashboard home page!\n\nThe report includes:\n📄 Page 1: Your full skin profile cover\n📄 Page 2: Detailed analysis + seasonal colour & skincare recommendations\n📄 Page 3: Wardrobe, lifestyle & skin habit guide\n\nClick the purple **'Export PDF Report'** banner on the dashboard!" },

  // Goals
  { keys: ['goal','skin goal','target','improve skin','track progress'],
    ans: "Use our **Goals Tracker** to set and track your skin goals!\n\n🎯 Available goals:\n• Reduce Dark Spots\n• Achieve Hydrated Skin\n• Clear Acne\n• Minimise Pores\n• Anti-Aging\n• Even Skin Tone\n\nEach goal comes with a tailored product list and routine. Find it in the sidebar under Goals!" },

  // Journey
  { keys: ['journey','progress','history','timeline','improvement','before after'],
    ans: "Track your **Skin Journey** in the dedicated timeline page!\n\nYou'll see:\n📅 Every scan you've done, in order\n📈 Your skin score at each point\n🏆 Milestones and achievements unlocked\n✨ Month-by-month improvement summary\n\nFind it in the sidebar under Skin Journey!" },

  // Subscription
  { keys: ['subscription','box','monthly box','beauty box','subscription box'],
    ans: "Our curated **Subscription Boxes** deliver personalised skincare monthly:\n\n📦 **GlowBox Monthly** (₹999/mo) — K-beauty + Indian skincare\n📦 **The Derma Edit** (₹1,499/mo) — Clinical-grade actives\n📦 **Purplle Beauty Bag** (₹599/mo) — Budget bestsellers\n📦 **Nykaa Beauty Box** (₹799/mo) — Makeup + skincare\n\nFind them in Product Curations → Subscription Boxes!" },

  // Thanks / Bye
  { keys: ['thank','thanks','thank you','thx','thankyou'],
    ans: "You're so welcome! 💜 Your skin deserves the very best. Feel free to ask me anything else anytime. Keep glowing! ✨" },
  { keys: ['bye','goodbye','see you','later','exit','close'],
    ans: "Goodbye! 🌟 Take care of your skin and come back anytime. Remember: SPF every day!" },
  { keys: ['help','what can you do','what do you know','capabilities'],
    ans: "I can help you with:\n\n🔍 Skincare routine building\n💊 Ingredient deep-dives & safety\n🪥 Skin concern advice (acne, dark spots, aging, etc.)\n🛍️ Product recommendations\n💆 Spa service guidance & booking info\n📊 Understanding your scan results\n☀️ Weather-based skin tips\n🎯 Skin goals & progress tracking\n\nJust ask me anything!" },
];

const getResponse = (msg) => {
  const lower = msg.toLowerCase();
  for (const item of KB) {
    if (item.keys.some(k => lower.includes(k))) return item.ans;
  }
  return "I'm not sure about that specific question, but I'd love to help! 🤔\n\nYou could ask me about:\n• Skincare routines\n• Ingredients (niacinamide, retinol, SPF...)\n• Specific skin concerns\n• Our spa services\n• Product recommendations\n\nOr visit the Skin Health Dashboard for your personalised analysis!";
};

const QUICK_QUESTIONS = [
  'Best routine for oily skin?',
  'What does niacinamide do?',
  'How do I remove tan?',
  'Recommend a facial for me',
  'Is retinol safe?',
  'Best budget products?',
];

// ─────────────────────────────────────────────────────────────────────────────
// CHATBOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const BeautyChatbot = () => {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm **Glow** ✨ — your AI beauty assistant.\n\nAsk me anything about skincare, ingredients, spa services, or your skin analysis!", ts: new Date() }
  ]);
  const [typing, setTyping]   = useState(false);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg, ts: new Date() }]);
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: getResponse(msg), ts: new Date() }]);
      setTyping(false);
    }, 700 + Math.random() * 400);
  };

  const formatText = (text) =>
    text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/\*\*(.+?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl
                   hover:bg-indigo-700 transition-all flex items-center justify-center group"
        aria-label="Open beauty assistant"
      >
        {open
          ? <FaChevronDown className="text-lg" />
          : <>
              <FaRobot className="text-xl" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </>
        }
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[370px] max-w-[calc(100vw-2rem)] bg-white
                        rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
             style={{ height: '520px' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <FaRobot />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Glow — Beauty Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-[10px] text-indigo-200">AI-powered · Always available</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/70 hover:text-white transition-colors">
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <FaRobot className="text-indigo-600 text-xs" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-700 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
                  {formatText(msg.text)}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <FaRobot className="text-indigo-600 text-xs" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                         style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
            {QUICK_QUESTIONS.map(q => (
              <button key={q} onClick={() => send(q)}
                className="whitespace-nowrap text-[10px] font-semibold px-3 py-1.5 bg-indigo-50
                           border border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 bg-white border-t border-gray-200 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask me anything about skincare..."
              className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                         placeholder:text-gray-400 text-gray-700 bg-gray-50"
            />
            <button onClick={() => send()}
              className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center
                         hover:bg-indigo-700 transition-colors shrink-0">
              <FaPaperPlane className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BeautyChatbot;
