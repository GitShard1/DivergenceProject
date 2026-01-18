const API_ENDPOINT = "http://localhost:8000";

// GitHub login handler
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('github-login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = `${API_ENDPOINT}/auth/github`;
    });
  }

  // Check for token in URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('access_token');
  const username = params.get('username');
  
  if (token && username) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('username', username);
    window.history.replaceState({}, document.title, '/');
    window.location.href = 'home.html';
  }
});

const AUTH_TOKEN = localStorage.getItem('auth_token') || null;

// Function to process GitHub data
async function processGitHub() {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('auth_token');
  
  if (!username || !token) {
    console.error('No auth credentials');
    return null;
  }

  try {
    const response = await fetch(`${API_ENDPOINT}/process-github/${username}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to process GitHub data');
    }

    const data = await response.json();
    return data.translated_data;
  } catch (error) {
    console.error('Error processing GitHub:', error);
    return null;
  }
}

// Transform filtered.json data into displayable format
function transformFilteredData(filteredJson, username) {
  const repos = filteredJson.repositories || [];
  
  // Language frequency from all repos
  const languageFreq = {};
  repos.forEach(repo => {
    Object.entries(repo.languages || {}).forEach(([lang, count]) => {
      languageFreq[lang] = (languageFreq[lang] || 0) + count;
    });
  });

  // Get top 5 projects by size
  const topProjects = repos
    .sort((a, b) => (b.size_kb || 0) - (a.size_kb || 0))
    .slice(0, 5)
    .map(repo => ({
      id: repo.name,
      name: repo.name,
      description: `Size: ${repo.size_kb?.toFixed(1) || 0}KB | Languages: ${Object.keys(repo.languages || {}).join(', ') || 'N/A'}`,
      stars: Math.floor((repo.test_coverage || 0) * 100),
      forks: Object.keys(repo.languages || {}).length,
      language: {
        name: Object.keys(repo.languages || {})[0] || "Unknown",
        color: "#999999"
      }
    }));

  // Get new projects (randomly pick from remaining)
  const newProjects = repos
    .slice(5, 10)
    .map(repo => ({
      id: repo.name,
      name: repo.name,
      description: `Frameworks: ${repo.frameworks?.join(', ') || 'None'} | Files: ${Object.keys(repo.file_types || {}).length}`,
      createdAt: "Recently",
      language: {
        name: Object.keys(repo.languages || {})[0] || "Unknown",
        color: "#666666"
      }
    }));

  return {
    profile: {
      name: username || "Developer",
      username: username,
      avatarUrl: `https://github.com/${username}.png`,
      bio: `GitHub developer with ${repos.length} repositories analyzed`
    },
    statsHome: {
      totalProjects: repos.length,
      totalRating: 4.0,
      totalLanguages: Object.keys(languageFreq).length
    },
    skills: {
      radar: [
        { subject: "Coding", score: Object.keys(languageFreq).length * 10 },
        { subject: "Web Dev", score: 70 },
        { subject: "Open Source", score: 60 },
        { subject: "Problem Solving", score: 75 },
        { subject: "Code Quality", score: 65 },
        { subject: "Collaboration", score: 70 }
      ],
      technical: Object.keys(languageFreq).slice(0, 12)
    },
    languages: Object.entries(languageFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([lang, count]) => ({
        name: lang,
        percentage: Math.min(100, (count / repos.length) * 50),
        color: "#3572A5"
      })),
    frameworks: repos
      .flatMap(r => r.frameworks || [])
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 6),
    libraries: repos
      .flatMap(r => Object.keys(r.libraries || {}))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 10),
    projects: {
      top: topProjects,
      new: newProjects
    },
    recentWorks: []
  };
}

/** -----------------------
 *  MOCK DATA (Normalized)
 *  Replace/mock as needed.
 *  --------------------- */
const mockUserData = {
    profile: {
        name: "Julian Martinez",
        username: "juliandev",
        avatarUrl: "assets/me.jpg",
        bio: "Full-stack developer passionate about building scalable applications",
    },
    statsHome: {
        totalProjects: 47,
        totalRating: 4.5,  // Keep this
        totalLanguages: 12,
    },
    skills: {
        radar: [
            { subject: "AI/ML", score: 10 },
            { subject: "Web Dev", score: 90 },
            { subject: "Data Engineering", score: 70 },
            { subject: "Cybersecurity", score: 65 },
            { subject: "Data Modelling", score: 70 },
            { subject: "API Development", score: 85 },
            { subject: "Algorithms", score: 80 },
        ],
        technical: [
            "React",
            "Node.js",
            "GraphQL",
            "Docker",
            "Kubernetes",
            "AWS",
            "PostgreSQL",
            "MongoDB",
            "Redis",
            "CI/CD",
            "Microservices",
            "REST APIs",
        ],
    },
    languages: [
        { name: "JavaScript", percentage: 70, color: "#f1e05a" },
        { name: "TypeScript", percentage: 60, color: "#3178c6" },
        { name: "Python", percentage: 50, color: "#3572A5" },
        { name: "Java", percentage: 40, color: "#b07219" },
        { name: "Go", percentage: 30, color: "#00ADD8" },
        { name: "Rust", percentage: 20, color: "#dea584" },
    ],
    frameworks: ["Next.js", "Express", "FastAPI", "Spring Boot", "Django", "Gin"],
    libraries: [
        "Redux",
        "React Query",
        "Axios",
        "Jest",
        "Tailwind CSS",
        "Material-UI",
        "D3.js",
        "Recharts",
        "Pandas",
        "NumPy",
    ],
    projects: {
        top: [
            {
                id: 1,
                name: "AI Chat Assistant",
                description: "Machine learning powered chatbot with NLP capabilities",
                stars: 512,
                forks: 89,
                language: { name: "Python", color: "#3572A5" },
            },

        ],
        new: [
            {
                id: 1,
                name: "Blockchain Wallet",
                description: "Secure cryptocurrency wallet with multi-chain support",
                language: { name: "Rust", color: "#dea584" },
                createdAt: "3 days ago",
                commits: 12,
            },
        ],
        all: [
            {
                id: 1,
                name: "E-Commerce Platform",
                description:
                    "Full-stack e-commerce application with real-time inventory management",
                stars: 234,
                forks: 45,
                language: { name: "TypeScript", color: "#3178c6" },
                technologies: ["React", "Node.js", "PostgreSQL", "Stripe API", "Docker"],
                skillsLearned: [
                    "Payment Integration",
                    "Real-time Updates",
                    "Database Optimization",
                ],
                url: "https://github.com/juliandev/ecommerce-platform",
            },
            {
                id: 2,
                name: "AI Chat Assistant",
                description:
                    "Machine learning powered chatbot with natural language processing",
                stars: 512,
                forks: 89,
                language: { name: "Python", color: "#3572A5" },
                technologies: ["Python", "TensorFlow", "FastAPI", "NLP", "Docker"],
                skillsLearned: ["Machine Learning", "Model Training", "API Design"],
                url: "https://github.com/juliandev/ai-chat-assistant",
            },
            {
                id: 3,
                name: "Real-time Dashboard",
                description:
                    "Analytics dashboard with live data visualization and custom reporting",
                stars: 178,
                forks: 32,
                language: { name: "JavaScript", color: "#f1e05a" },
                technologies: ["React", "D3.js", "WebSocket", "Redis", "AWS"],
                skillsLearned: [
                    "Data Visualization",
                    "WebSocket Integration",
                    "Cloud Deployment",
                ],
                url: "https://github.com/juliandev/realtime-dashboard",
            },
        ],
    },
    recentWorks: [
        {
            id: 1,
            name: "Update authentication flow",
            project: "E-Commerce Platform",
            status: "In Progress",
            priority: "High",
            lastUpdated: "2 hours ago",
        },
    ],
};

/** -----------------------
 *  DOM HELPERS (SAFE)
 *  --------------------- */
function $(selector, root = document) {
    return root.querySelector(selector);
}
function clearEl(el) {
    if (el) el.textContent = "";
    if (el) while (el.firstChild) el.removeChild(el.firstChild);
}
function setText(el, text) {
    if (!el) return;
    el.textContent = text == null ? "" : String(text);
}
function setAttr(el, name, value) {
    if (!el) return;
    if (value == null) el.removeAttribute(name);
    else el.setAttribute(name, String(value));
}
function createEl(tag, opts = {}) {
    const el = document.createElement(tag);
    if (opts.className) el.className = opts.className;
    if (opts.text != null) el.textContent = String(opts.text);
    if (opts.attrs) {
        Object.entries(opts.attrs).forEach(([k, v]) => setAttr(el, k, v));
    }
    return el;
}
function toClassToken(str) {
    return String(str || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}

/** -----------------------
 *  NORMALIZER
 *  Accepts:
 *  - normalized API response
 *  - your old mock with nameTop/nameNew/nameAll fields
 *  Returns a normalized object.
 *  --------------------- */
function normalizeUserData(raw) {
    if (!raw || typeof raw !== "object") return structuredClone(mockUserData);

    const looksNormalized =
        raw.profile && (raw.profile.avatarUrl || raw.profile.name || raw.profile.username);

    const looksLegacy =
        raw.profile &&
        (raw.profile.nameUser || raw.profile.username) &&
        (raw.profile.avatar || raw.profile.bio);

    let normalized = {};

    if (looksNormalized && !looksLegacy) {
        normalized = raw;
    } else if (looksLegacy) {
        normalized = {
            profile: {
                name: raw.profile.nameUser ?? raw.profile.name ?? "",
                username: raw.profile.username ?? "",
                avatarUrl: raw.profile.avatar ?? raw.profile.avatarUrl ?? "",
                bio: raw.profile.bio ?? "",
            },
            statsHome: {
                totalProjects: raw.statsHome?.totalProjects ?? 0,
                totalRating: raw.statsHome?.totalRating ?? raw.statsHome?.totalHours ?? 0,  // FIX: Added totalRating
                totalLanguages: raw.statsHome?.totalLanguages ?? 0,
            },
            skills: {
                radar: Array.isArray(raw.skills?.radar) ? raw.skills.radar : [],
                technical: Array.isArray(raw.skills?.technical) ? raw.skills.technical : [],
            },
            languages: Array.isArray(raw.languages)
                ? raw.languages.map((l) => ({
                    name: l.nameLanguage ?? l.name ?? "",
                    percentage: l.percentageLanguage ?? l.percentage ?? 0,
                    color: l.color ?? "#999999",
                }))
                : [],
            frameworks: Array.isArray(raw.frameworks) ? raw.frameworks : [],
            libraries: Array.isArray(raw.libraries) ? raw.libraries : [],
            projects: {
                top: Array.isArray(raw.projects?.top)
                    ? raw.projects.top.map((p) => ({
                        id: p.id,
                        name: p.nameTop ?? p.name ?? "",
                        description: p.descriptionTop ?? p.description ?? "",
                        stars: p.starsTop ?? p.stars ?? 0,
                        forks: p.forksTop ?? p.forks ?? 0,
                        language: {
                            name: p.languageTop ?? p.language?.name ?? "",
                            color: p.languageColorTop ?? p.language?.color ?? "#999999",
                        },
                    }))
                    : [],
                new: Array.isArray(raw.projects?.new)
                    ? raw.projects.new.map((p) => ({
                        id: p.id,
                        name: p.nameNew ?? p.name ?? "",
                        description: p.descriptionNew ?? p.description ?? "",
                        createdAt: p.createdAtNew ?? p.createdAt ?? "",
                        commits: p.commitsNew ?? p.commits ?? 0,
                        language: {
                            name: p.languageNew ?? p.language?.name ?? "",
                            color: p.languageColorNew ?? p.language?.color ?? "#999999",
                        },
                    }))
                    : [],
                all: Array.isArray(raw.projects?.all)
                    ? raw.projects.all.map((p) => ({
                        id: p.id,
                        name: p.nameAll ?? p.name ?? "",
                        description: p.descriptionAll ?? p.description ?? "",
                        stars: p.starsAll ?? p.stars ?? 0,
                        forks: p.forksAll ?? p.forks ?? 0,
                        url: p.urlAll ?? p.url ?? "",
                        language: {
                            name: p.languageAll ?? p.language?.name ?? "",
                            color: p.languageColorAll ?? p.language?.color ?? "#999999",
                        },
                        technologies: p.technologiesAll ?? p.technologies ?? [],
                        skillsLearned: p.skillsLearnedAll ?? p.skillsLearned ?? [],
                    }))
                    : [],
            },
            recentWorks: Array.isArray(raw.recentWorks)
                ? raw.recentWorks.map((w) => ({
                    id: w.id,
                    name: w.nameRecent ?? w.name ?? "",
                    project: w.projectRecent ?? w.project ?? "",
                    status: w.statusRecent ?? w.status ?? "",
                    priority: w.priorityRecent ?? w.priority ?? "",
                    lastUpdated: w.lastUpdatedRecent ?? w.lastUpdated ?? "",
                }))
                : [],
        };
    } else {
        normalized = structuredClone(mockUserData);
    }

    return deepMerge(structuredClone(mockUserData), normalized);
}

function deepMerge(base, patch) {
    if (!patch || typeof patch !== "object") return base;
    Object.keys(patch).forEach((k) => {
        const pv = patch[k];
        const bv = base[k];
        if (Array.isArray(pv)) base[k] = pv;
        else if (pv && typeof pv === "object" && !Array.isArray(pv)) {
            base[k] = deepMerge(bv && typeof bv === "object" ? bv : {}, pv);
        } else {
            base[k] = pv;
        }
    });
    return base;
}

/** -----------------------
 *  API FETCH
 *  --------------------- */
async function fetchUserData() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('auth_token');
    
    // If we have auth credentials, try to fetch filtered data from backend
    if (username && token) {
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            };
            
            const res = await fetch(`${API_ENDPOINT}/get-filtered-data/${username}`, { 
                method: 'GET', 
                headers 
            });
            
            if (res.ok) {
                const filteredJson = await res.json();
                const transformedData = transformFilteredData(filteredJson, username);
                return normalizeUserData(transformedData);
            }
        } catch (err) {
            console.warn('Failed to fetch filtered data, falling back to mock:', err);
        }
    }
    
    // Fallback: use mock data
    return normalizeUserData(mockUserData);
}

/** -----------------------
 *  CHART.JS (Radar)
 *  --------------------- */
let skillsChartInstance = null;

function renderSkillsRadarChart(canvasEl, radar) {
    if (!canvasEl) return;

    // If Chart.js isn't available, fail gracefully
    if (typeof Chart === "undefined") {
        console.warn("Chart.js not found. Radar chart skipped.");
        return;
    }

    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    if (skillsChartInstance) {
        try {
            skillsChartInstance.destroy();
        } catch (_) {
            // ignore
        }
        skillsChartInstance = null;
    }

    const labels = (radar || []).map((s) => s.subject);
    const values = (radar || []).map((s) => s.score);

    skillsChartInstance = new Chart(ctx, {
        type: "radar",
        data: {
            labels,
            datasets: [
                {
                    label: "Skills",
                    data: values,
                    backgroundColor: "rgba(46, 160, 67, 0.3)",
                    borderColor: "#2ea043",
                    borderWidth: 2,
                    pointBackgroundColor: "#2ea043",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "#2ea043",
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { stepSize: 20, color: "#8b949e", backdropColor: "transparent" },
                    grid: { color: "#30363d" },
                    pointLabels: { color: "#8b949e", font: { size: 12 } },
                },
            },
            plugins: { legend: { display: false } },
        },
    });
}

/** -----------------------
 *  RENDER: PROFILE
 *  --------------------- */
function renderProfilePage(data) {
    // 1) Profile Picture
    const profilePicture = $(".profile-picture");
    if (profilePicture) {
        setAttr(profilePicture, "src", data.profile.avatarUrl);
        setAttr(profilePicture, "alt", data.profile.name);
    }

    // 2) Name
    setText($(".profile-name"), data.profile.name);

    // 3) Username
    setText($(".profile-username"), data.profile.username ? `@${data.profile.username}` : "");

    // 4) Bio
    setText($(".profile-bio"), data.profile.bio);

    // 5) Languages Grid
    const languagesGrid = $(".languages-grid");
    if (languagesGrid) {
        clearEl(languagesGrid);
        const frag = document.createDocumentFragment();

        data.languages.forEach((lang) => {
            const item = createEl("div", { className: "language-item" });

            const dot = createEl("span", { className: "language-dot" });
            dot.style.backgroundColor = lang.color || "#999999";

            const name = createEl("span", { className: "language-name", text: lang.name });
            const pct = createEl("span", {
                className: "language-percentage",
                text: `${lang.percentage}%`,
            });

            item.append(dot, name, pct);
            frag.appendChild(item);
        });

        languagesGrid.appendChild(frag);
    }

    // 6) Frameworks
    const frameworksContainer = $(".frameworks-section .tags-container");
    if (frameworksContainer) {
        clearEl(frameworksContainer);
        const frag = document.createDocumentFragment();
        data.frameworks.forEach((fw) => {
            frag.appendChild(createEl("span", { className: "tag tag-purple", text: fw }));
        });
        frameworksContainer.appendChild(frag);
    }

    // 7) Libraries
    const librariesContainer = $(".libraries-section .tags-container");
    if (librariesContainer) {
        clearEl(librariesContainer);
        const frag = document.createDocumentFragment();
        data.libraries.forEach((lib) => {
            frag.appendChild(createEl("span", { className: "tag tag-green", text: lib }));
        });
        librariesContainer.appendChild(frag);
    }

    // 8) Skills Radar Chart
    renderSkillsRadarChart($("#skillsChart"), data.skills.radar);
}

/** -----------------------
 *  RENDER: HOME
 *  --------------------- */
function renderHomePage(data) {
    // 1) Avatar
    const profileAvatar = $(".profile-avatar");
    if (profileAvatar) {
        setAttr(profileAvatar, "src", data.profile.avatarUrl);
        setAttr(profileAvatar, "alt", data.profile.name);
    }

    // 2) Name
    setText($(".profile-info h2"), data.profile.name);

    // 3) Username
    setText($(".profile-info .username"), data.profile.username ? `@${data.profile.username}` : "");

    // 4) Stats
    setText($(".stat-value-projects"), data.statsHome.totalProjects);

    // FIX: Use totalRating instead of rating
    setText(
        $(".stat-value-rating"),
        `${Number(data.statsHome.totalRating || 0).toFixed(1)}`  // Shows 4.5 with 1 decimal
    );

    setText($(".stat-value-languages"), data.statsHome.totalLanguages);

    // 5) Top Projects list selector (keep yours; ideally add an id hook in HTML)
    const topProjectsList = $(".left-column .section-card:first-child .projects-list");
    if (topProjectsList) {
        clearEl(topProjectsList);
        const frag = document.createDocumentFragment();

        data.projects.top.forEach((p) => {
            const item = createEl("div", { className: "project-item" });

            item.appendChild(createEl("h4", { className: "project-name", text: p.name }));
            item.appendChild(createEl("p", { className: "project-desc", text: p.description }));

            const meta = createEl("div", { className: "project-meta" });

            const lang = createEl("div", { className: "meta-item" });
            const dot = createEl("span", { className: "language-dot" });
            dot.style.backgroundColor = p.language?.color || "#999999";
            lang.append(dot, createEl("span", { text: p.language?.name || "" }));

            const stars = createEl("div", { className: "meta-item" });
            stars.append(
                inlineSvgStar16(),
                createEl("span", { text: String(p.stars ?? 0) })
            );

            const forks = createEl("div", { className: "meta-item" });
            forks.append(
                inlineSvgFork16(),
                createEl("span", { text: String(p.forks ?? 0) })
            );

            meta.append(lang, stars, forks);
            item.appendChild(meta);

            frag.appendChild(item);
        });

        topProjectsList.appendChild(frag);
    }

    // 6) New Projects
    const newProjectsList = $(".left-column .section-card:nth-child(2) .projects-list");
    if (newProjectsList) {
        clearEl(newProjectsList);
        const frag = document.createDocumentFragment();

        data.projects.new.forEach((p) => {
            const item = createEl("div", { className: "project-item" });

            const header = createEl("div", { className: "project-header" });
            header.append(
                createEl("h4", { className: "project-name", text: p.name }),
                createEl("span", { className: "project-date", text: p.createdAt })
            );

            item.append(header);
            item.appendChild(createEl("p", { className: "project-desc", text: p.description }));

            const meta = createEl("div", { className: "project-meta" });

            const lang = createEl("div", { className: "meta-item" });
            const dot = createEl("span", { className: "language-dot" });
            dot.style.backgroundColor = p.language?.color || "#999999";
            lang.append(dot, createEl("span", { text: p.language?.name || "" }));

            const commits = createEl("div", { className: "meta-item" });
            commits.appendChild(createEl("span", { text: `${p.commits ?? 0} commits` }));

            meta.append(lang, commits);
            item.appendChild(meta);

            frag.appendChild(item);
        });

        newProjectsList.appendChild(frag);
    }

    // 7) Recent Works
    const worksList = $(".works-list");
    if (worksList) {
        clearEl(worksList);
        const frag = document.createDocumentFragment();

        data.recentWorks.forEach((w) => {
            const item = createEl("div", { className: "work-item" });

            const header = createEl("div", { className: "work-header" });
            header.appendChild(createEl("h4", { text: w.name }));

            const priority = createEl("span", {
                className: `priority-badge ${toClassToken(w.priority)}`,
                text: w.priority,
            });
            header.appendChild(priority);

            const project = createEl("p", { className: "work-project", text: w.project });

            const footer = createEl("div", { className: "work-footer" });

            const statusClass = w.status === "In Progress" ? "in-progress" : "todo";
            const status = createEl("span", {
                className: `status-badge ${statusClass}`,
                text: w.status,
            });

            const time = createEl("span", { className: "work-time", text: w.lastUpdated });

            footer.append(status, time);

            item.append(header, project, footer);
            frag.appendChild(item);
        });

        worksList.appendChild(frag);
    }
}

/** -----------------------
 *  RENDER: PROJECTS
 *  --------------------- */
function renderProjectsPage(data) {
    const projectsGrid = $(".projects-grid");
    if (!projectsGrid) return;

    clearEl(projectsGrid);
    const frag = document.createDocumentFragment();

    data.projects.all.forEach((p) => {
        const card = createEl("article", { className: "project-card" });

        const header = createEl("div", { className: "project-card-header" });
        header.appendChild(createEl("h3", { className: "project-title", text: p.name }));

        if (p.url) {
            const a = createEl("a", {
                className: "project-link",
                attrs: { href: p.url, target: "_blank", rel: "noopener noreferrer" },
            });
            a.appendChild(inlineSvgExternal20());
            header.appendChild(a);
        }

        card.appendChild(header);
        card.appendChild(
            createEl("p", { className: "project-description", text: p.description })
        );

        const stats = createEl("div", { className: "project-stats" });

        const lang = createEl("div", { className: "stat-item" });
        const dot = createEl("span", { className: "language-dot" });
        dot.style.backgroundColor = p.language?.color || "#999999";
        lang.append(dot, createEl("span", { text: p.language?.name || "" }));

        const stars = createEl("div", { className: "stat-item" });
        stars.append(inlineSvgStar16(), createEl("span", { text: String(p.stars ?? 0) }));

        const forks = createEl("div", { className: "stat-item" });
        forks.append(inlineSvgFork16(), createEl("span", { text: String(p.forks ?? 0) }));

        stats.append(lang, stars, forks);
        card.appendChild(stats);

        // Technologies
        const techBlock = createEl("div", { className: "project-technologies" });
        techBlock.appendChild(createEl("p", { className: "section-label", text: "Technologies Used" }));
        const techTags = createEl("div", { className: "tech-tags" });
        (p.technologies || []).forEach((t) =>
            techTags.appendChild(createEl("span", { className: "tech-tag", text: t }))
        );
        techBlock.appendChild(techTags);
        card.appendChild(techBlock);

        // Skills learned
        const skillsBlock = createEl("div", { className: "project-skills" });
        skillsBlock.appendChild(
            createEl("p", { className: "section-label skills-label", text: "Skills Learned" })
        );
        const skillsTags = createEl("div", { className: "skills-tags" });
        (p.skillsLearned || []).forEach((s) =>
            skillsTags.appendChild(createEl("span", { className: "skill-tag", text: s }))
        );
        skillsBlock.appendChild(skillsTags);
        card.appendChild(skillsBlock);

        frag.appendChild(card);
    });

    projectsGrid.appendChild(frag);
}

/** -----------------------
 *  ICONS (inline SVG)
 *  --------------------- */
function inlineSvgStar16() {
    const wrap = document.createElement("span");
    wrap.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>' +
        "</svg>";
    return wrap.firstChild;
}

function inlineSvgFork16() {
    const wrap = document.createElement("span");
    wrap.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<line x1="6" y1="3" x2="6" y2="15"></line>' +
        '<circle cx="18" cy="6" r="3"></circle>' +
        '<circle cx="6" cy="18" r="3"></circle>' +
        '<path d="M18 9a9 9 0 0 1-9 9"></path>' +
        "</svg>";
    return wrap.firstChild;
}

function inlineSvgExternal20() {
    const wrap = document.createElement("span");
    wrap.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>' +
        '<polyline points="15 3 21 3 21 9"></polyline>' +
        '<line x1="10" y1="14" x2="21" y2="3"></line>' +
        "</svg>";
    return wrap.firstChild;
}

/** -----------------------
 *  PAGE ROUTING
 *  - Prefer <body data-page="profile|home|projects">
 *  - Fallback to pathname file
 *  --------------------- */
function getCurrentPageKey() {
    const byDataset = document.body && document.body.dataset && document.body.dataset.page;
    if (byDataset) return String(byDataset).toLowerCase();

    const file = (window.location.pathname.split("/").pop() || "").toLowerCase();
    if (file.includes("profile")) return "profile";
    if (file.includes("projects")) return "projects";
    if (file.includes("home") || file.includes("index")) return "home";
    return "unknown";
}

function renderCurrentPage(data) {
    const page = getCurrentPageKey();
    if (page === "profile") renderProfilePage(data);
    else if (page === "home") renderHomePage(data);
    else if (page === "projects") renderProjectsPage(data);
    else console.log("Page does not require data rendering");
}

/** -----------------------
 *  INIT
 *  --------------------- */
async function initializePage() {
    try {
        const data = await fetchUserData();
        renderCurrentPage(data);
    } catch (err) {
        console.error("Falling back to mock data:", err);
        renderCurrentPage(normalizeUserData(mockUserData));
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage);
} else {
    initializePage();
}

/** -----------------------
 *  EXPORTS (if you use <script type="module">)
 *  --------------------- */
export {
    mockUserData,
    normalizeUserData,
    fetchUserData,
    renderProfilePage,
    renderHomePage,
    renderProjectsPage,
    initializePage,
};
