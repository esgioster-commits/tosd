# 🏊 EAC Championship 2026 - Meet Program & Swimmer Tracker

An interactive, mobile-friendly web application for the **EAC Championship 2026** swimming competition at Dubai American Academy. Search for any swimmer to instantly view their scheduled events, start times, heats, lanes, and full heat competitor matchups with an interactive visual pool lane layout.

---

## 🌟 Key Features

1. **Swimmer Live Lookup (Requirement 1 & 2)**
   - Search by first name or last name with instant autocomplete (e.g., `Charlie`, `Kim`, `Dominguez`, `Olivia`, `Emme`).
   - **Full Event Schedule (Requirement 1)**:
     - Event number & title (e.g. *Event 5: Boys 14 & Under 50 SC Meter Backstroke*)
     - Session badge (*Morning Session* / *Afternoon Session*)
     - Scheduled start time (*Starts at 09:51 AM*)
     - Heat number (*Heat 3 of 3*)
     - Assigned lane (*Lane 4*)
     - Seed time (*35.63*)
   - **Heat Competitor Matchups (Requirement 2)**:
     - 🏊 **Visual Pool Lane Graphic**: Visualizes Lanes 1 through 8 with the selected swimmer prominently highlighted.
     - 📋 **Matchup Table**: Complete listing of all heat competitors (Lane, Name, Age, Team, Seed Time).
     - **Click to Navigate**: Clicking on any competitor's name instantly opens that swimmer's complete meet schedule.

2. **Official Meet Program View (Requirement 4)**
   - Click the **"📋 Full Meet Program"** tab to view the complete heat sheets exactly as printed in HY-TEK's Meet Manager program.
   - Filter by session (*All Sessions*, *Morning Session*, *Afternoon Session*) or jump directly to any event.
   - Click any swimmer name in the heat sheets to jump directly to their profile.

3. **Direct Shareable Links (Deep Linking)**
   - Share a direct link to any swimmer's schedule (e.g., `https://your-domain.com/?swimmer=Kim,%20Charlie`).
   - Click the **"🔗 Copy Share Link"** button to copy the link directly to your clipboard for WhatsApp, SMS, or email.

4. **Teams & Rosters**
   - Browse swimmers grouped by participating schools and clubs (American School of Dubai, Daa Leopards, American Community School, Gems American Academy, Dunecrest Eagles, American International School).

5. **Starred Swimmers (⭐ Favorites)**
   - Star your family members or teammates to access their races in one click from the "My Swimmers" tab (saved in local browser storage).

6. **Mobile Optimized & Print Friendly**
   - Built with responsive design for seamless viewing on smartphones at the pool.
   - Built-in print button generates clean, printer-friendly paper schedules.

---

## 📂 Project Structure

- **`index.html`**: Main HTML5 web interface (English UI)
- **`data.js`**: Structured meet database parsed from all 5 attached meet program sheets (13 events, 33 heats, 217 swimmer entries)
- **`app.js`**: Search engine, pool visualizer, heat matchups, deep linking, and favorites manager
- **`styles.css`**: Aquatic color theme, lane animations, and print stylesheets
- **`Run_Website.bat`**: Double-click launcher to open the website instantly on Windows
- **`실행하기.bat`**: 한글 실행 배치 파일

---

## 🚀 How to Run & Share (Free Hosting)

### 1. View Locally on Your PC
- Double-click **`Run_Website.bat`** (or `index.html`) to launch the website in Chrome, Safari, or Edge. No installation or build steps required.

### 2. Free Web Link Deployment (Ready to share in 30 seconds)

#### Option A: Netlify Drop (Easiest - Drag & Drop)
1. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the four files (`index.html`, `data.js`, `app.js`, `styles.css`) onto the webpage.
3. You will immediately receive a live public URL (e.g., `https://eac-championship-2026.netlify.app`) that you can send to parents and swimmers!

#### Option B: Vercel
1. Import or drag the folder to [https://vercel.com](https://vercel.com) for fast global hosting.

#### Option C: GitHub Pages
1. Push this folder to a GitHub repository and enable **GitHub Pages** under `Settings > Pages`.
