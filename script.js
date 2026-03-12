// 1. SUPABASE INITIALIZATION
const SUPABASE_URL = 'https://aqromksnrykuakcmvhjg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GgfGatSj5nAsT_LijOZgRQ_vrIozPii';

// Use a unique name to avoid "already declared" errors
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let watchlist = [];
let currentData = [];

// 2. SIGN-IN LOGIC
document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('authMsg');

    // Attempt Login
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        // If account doesn't exist, try Signing Up
        const { error: signUpError } = await supabaseClient.auth.signUp({ email, password });
        if (signUpError) {
            msg.innerText = signUpError.message;
        } else {
            msg.style.color = "#00ffcc";
            msg.innerText = "Success! Check your email to confirm, then Login.";
        }
    } else {
        // SUCCESS: Hide Login, Show App, Show Pirate Sidebar
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('sidebarBtn').style.display = 'block';
        initApp(); 
    }
};

// 3. DATABASE SYNC (Post-Login)
async function syncWatchlist() {
    // This now only fetches items belonging to the logged-in user
    const { data, error } = await supabaseClient.from('Anime Sched').select('*');
    if (!error && data) {
        watchlist = data.map(item => item.anime_data);
        document.getElementById('wCount').innerText = watchlist.length;
    }
}

// 4. SIDEBAR TOGGLE
function toggleSidebar() {
    const sb = document.getElementById("pirateSidebar");
    sb.style.width = sb.style.width === "280px" ? "0" : "280px";
}

// 5. MAIN APP START
async function initApp() {
    await syncWatchlist();
    loadSeasonalData(); // Your existing function to fetch Spring 2026
    setupEventListeners();
}
