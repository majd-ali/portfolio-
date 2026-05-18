/* ============================================================
   Data layer — Firestore + Firebase Auth (images stored as base64 in Firestore).
   Cache is loaded once via MajdData.init() then exposed
   synchronously via MajdData.load().
   ============================================================ */
(function (global) {
  'use strict';

  const REACT_KEY = 'majd_portfolio_reactions_v1';
  const VISITOR_KEY = 'majd_visitor_v1';

  // Default seed content (used when Firestore is empty).
  const DEFAULT_DATA = {
    profile: {
      name: 'Majd Ali',
      title: 'AI Assistant & Team Leader · Data Analyst · AI Specialist',
      dob: '10/11/2001',
      pob: 'Latakia, Syria',
      nationality: 'Syrian',
      email: 'amajd8586@gmail.com',
      phone: '(+963) 937824156',
      motherTongue: 'Arabic',
      image: null
    },
    experience: [
      { id: 'exp1', company: 'Sonic', location: 'Latakia, Syria', role: 'AI assistant and Team leader', period: '1/1/2026 – Current', description:
        'Supporting artificial intelligence decision-making.\nOverseeing the development of artificial intelligence services and projects within the company.\nHandle daily administrative support for the team.\nManage documents, files, and data entry.\nCoordinate with designers, editors, and technical teams.\nUpload, organize, and maintain marketing and company files.\nAssist with content scheduling and postings when required.\nSupport day-to-day operations and follow-ups.\nMaintain records, access details, and system logins.\nProvide any additional administrative support required by management.\nCreate and manage Google Business Profile / Google Maps listing.\nSet up and manage Google Analytics (GA4).\nSet up and manage Google Search Console.' },
      { id: 'exp2', company: 'Ennwy', location: 'Damascus, Syria', role: 'Data analyst and AI Consultant', period: '1/6/2025 – 31/12/2025', description:
        "Supporting AI decision-making within the company and overseeing the development of AI services within the company's application.\nAnalyzing company data and partner data, evaluating company performance periodically, and supervising the organization of data entry into the database.\nSubmitting reports to management monthly to support decision-making processes.\nFormatting and maintaining company data records." },
      { id: 'exp3', company: 'scit', location: 'Tartous, Syria', role: 'AI specialist', period: '1/9/2024 – 31/5/2025', description:
        'Design and implementation of machine learning models.\nImplementing computer vision and natural language processing projects.\nCollecting and formatting data appropriately to train artificial intelligence models to perform various tasks.' }
    ],
    education: [
      { id: 'edu1', title: 'Bachelor of informatics engineering', institution: 'Tishreen University', period: '1/9/2019 – 31/8/2025', location: 'Latakia, Syria' },
      { id: 'edu2', title: 'Data analyst', institution: 'IBM company', period: '', location: '' }
    ],
    languages: [
      { id: 'lng1', name: 'English', listening: 'B2', spokenProd: 'B1', reading: 'B2', spokenInter: 'B2', writing: 'B2' },
      { id: 'lng2', name: 'French', listening: 'A1', spokenProd: 'A1', reading: 'A2', spokenInter: 'A1', writing: 'A1' },
      { id: 'lng3', name: 'German', listening: 'A1', spokenProd: '', reading: 'A1', spokenInter: 'A1', writing: 'A1' }
    ],
    skills: ['Data Science','Data Analyst','Data Collection','Data Processing','Data Analysis','Data Visualisation','Machine Learning','Deep Learning','Python','Pandas','NumPy','SciPy','Scikit-learn','Gensim','Flair','Spacy','TF Hub','SeaBorn','Matplotlib','Tableau','ClickUp','Analytical Skills','NLP','Computer Vision'],
    cvProjects: [
      { id: 'cvp1', title: 'Image generation using GANs based on noisy input data', description: 'This project is based on a GAN network and can generate images with high accuracy using only noisy input data. It can be used to augment training data if limited or to generate any type of image we have trained on.' },
      { id: 'cvp2', title: 'A system for identifying oral problems by analyzing oral X-ray images', description: 'Analyzes oral X-ray images and identifies oral and gum diseases or whether the image is healthy, relying on the YOLOv8 network trained on a dataset containing 6 different classes.' },
      { id: 'cvp3', title: "Monitoring facial expressions to identify students' emotional state during online lectures", description: "Uses CNNs to divide students' emotional states based on their facial expressions into 7 different states." },
      { id: 'cvp4', title: 'Determining brain hemorrhage through brain CT scans', description: "Analyzes brain CT scans using a hybrid network of EfficientNetB2 and ResNet50 to identify brain hemorrhages and help doctors make informed medical decisions. The model's accuracy reaches up to 94%." },
      { id: 'cvp5', title: 'Chatbots for many things', description: 'A chatbot based on NLP and a dataset of common university registration questions that can interact with students and provide guidance. A chatbot relying on large English data to converse with the user to improve their language. A veterinarian chatbot that can diagnose pet diseases and prescribe treatment.' },
      { id: 'cvp6', title: 'Classify links into harmful and healthy links', description: 'Based on a dataset with two columns (the link and its category). Added 20 additional engineered features to classify links more precisely. The system classifies into four categories: benign, defacement, malware, phishing.' },
      { id: 'cvp7', title: "Categorizing tweets on X to track user's emotional state", description: 'Using NLP and machine learning algorithms, built a language model capable of classifying sentences into multiple sentiments, tested on a file containing 7,000 tweets collected manually from X.' },
      { id: 'cvp8', title: 'Road sign detection system', description: 'Relies on YOLO networks to identify road signs and classify them into 35 different types based on the training data.' },
      { id: 'cvp9', title: 'Recommendation systems', description: 'A recommendation system that suggests tourist attractions based on type, location, and evaluation using K-Means clustering. A recommendation system that suggests similar books and research in an electronic library by analyzing user input and determining similarity with stored project titles using LLM techniques.' },
      { id: 'cvp10', title: 'Object detection system', description: 'A system for identifying objects on the road usable in self-driving cars or surveillance cameras, using CNN and U-Net for object segmentation.' },
      { id: 'cvp11', title: 'Gender classification', description: 'Analyzes input facial images using a strongly connected neural network and determines gender.' },
      { id: 'cvp12', title: 'Tic-tac-toe game', description: 'A tic-tac-toe game to play against the computer. Uses Python for both backend and frontend.' }
    ],
    recommendations: [
      { id: 'rec1', name: 'Abdilazim Aslan', role: 'CEO Manager of Ennwy Technology Group', description: 'The CEO of Ennwy Technology Group, whom I got to know when I worked with him last year, is a great and wonderful person.', email: 'Info@ennwy.com', phone: '(+47) 91925151' },
      { id: 'rec2', name: 'Mohamad Mashi', role: 'Professor at the Faculty of Information Engineering at Latakia University', description: 'A professor in the Faculty of Information Engineering at Latakia University, in the Department of Artificial Intelligence, supervised my graduation project.', email: 'dr.eng.mm.project@gmail.com', phone: '' },
      { id: 'rec3', name: 'Yassin Alamari', role: 'CEO Manager of Sonic Marketing Company', description: 'The CEO of Sonic is a very nice and wonderful person. I got to know him when I started working with Sonic.', email: 'info@sonicmarketing.ae', phone: '(+971) 509441710' }
    ],
    articles: [],
    projects: []
  };

  let cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
  let adminFlag = false;
  let initialized = false;
  const authListeners = [];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function fb() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
      throw new Error('Firebase not configured. Edit assets/js/firebase-config.js with your project values.');
    }
    return {
      db: firebase.firestore(),
      auth: firebase.auth()
    };
  }

  async function init() {
    if (initialized) return cache;
    const { auth } = fb();
    const adminEmail = global.FIREBASE_ADMIN_EMAIL;

    auth.onAuthStateChanged(user => {
      adminFlag = !!(user && !user.isAnonymous && user.email === adminEmail);
      authListeners.forEach(cb => { try { cb(adminFlag); } catch (e) {} });
    });

    // Wait for Firebase to restore any persisted session before deciding
    // whether we need to sign in as anonymous. Otherwise we would overwrite
    // a logged-in admin with an anonymous session on every page load.
    await new Promise(resolve => {
      const unsubscribe = auth.onAuthStateChanged(() => {
        unsubscribe();
        resolve();
      });
    });

    if (!auth.currentUser) {
      try { await auth.signInAnonymously(); }
      catch (e) { console.warn('Anonymous sign-in failed:', e.message); }
    }

    await loadAll();
    initialized = true;
    return cache;
  }

  async function loadAll() {
    const { db } = fb();
    try {
      const [siteSnap, articlesSnap, projectsSnap] = await Promise.all([
        db.collection('site').doc('content').get(),
        db.collection('articles').get(),
        db.collection('projects').get()
      ]);

      const s = siteSnap.exists ? siteSnap.data() : {};
      cache = {
        profile: s.profile || clone(DEFAULT_DATA.profile),
        experience: s.experience || clone(DEFAULT_DATA.experience),
        education: s.education || clone(DEFAULT_DATA.education),
        languages: s.languages || clone(DEFAULT_DATA.languages),
        skills: s.skills || clone(DEFAULT_DATA.skills),
        cvProjects: s.cvProjects || clone(DEFAULT_DATA.cvProjects),
        recommendations: s.recommendations || clone(DEFAULT_DATA.recommendations),
        articles: articlesSnap.docs.map(d => Object.assign({ id: d.id }, d.data())),
        projects: projectsSnap.docs.map(d => Object.assign({ id: d.id }, d.data()))
      };
    } catch (e) {
      console.error('Load failed — showing defaults:', e);
      cache = clone(DEFAULT_DATA);
      throw e;
    }
  }

  function load() { return cache; }

  // ---- Auth ----
  function isLoggedIn() { return adminFlag; }
  function onAuthChange(cb) {
    authListeners.push(cb);
    cb(adminFlag);
  }
  async function login(email, password) {
    const { auth } = fb();
    const result = await auth.signInWithEmailAndPassword(email, password);
    if (result.user.email !== global.FIREBASE_ADMIN_EMAIL) {
      await auth.signOut();
      // Re-sign-in anonymously so the visitor experience continues.
      try { await auth.signInAnonymously(); } catch (e) {}
      throw new Error('This account is not the admin account.');
    }
    return true;
  }
  async function logout() {
    const { auth } = fb();
    await auth.signOut();
    try { await auth.signInAnonymously(); } catch (e) {}
  }
  async function changePassword(newPassword) {
    const { auth } = fb();
    const user = auth.currentUser;
    if (!user || user.isAnonymous) throw new Error('Sign in first.');
    await user.updatePassword(newPassword);
  }

  // ---- Site content (admin only) ----
  async function saveSiteContent() {
    const { db } = fb();
    await db.collection('site').doc('content').set({
      profile: cache.profile,
      experience: cache.experience,
      education: cache.education,
      languages: cache.languages,
      skills: cache.skills,
      cvProjects: cache.cvProjects,
      recommendations: cache.recommendations
    });
  }

  // ---- Articles ----
  async function saveArticle(article) {
    const { db } = fb();
    if (!article.id) article.id = uid();
    const { id, ...rest } = article;
    if (!rest.createdAt) rest.createdAt = Date.now();
    rest.updatedAt = Date.now();
    if (!rest.reactions) rest.reactions = { like: 0, dislike: 0 };
    if (!rest.comments) rest.comments = [];
    await db.collection('articles').doc(id).set(rest);

    const idx = cache.articles.findIndex(a => a.id === id);
    const fresh = Object.assign({ id }, rest);
    if (idx >= 0) cache.articles[idx] = fresh;
    else cache.articles.push(fresh);
    return fresh;
  }
  async function deleteArticle(id) {
    const { db } = fb();
    await db.collection('articles').doc(id).delete();
    cache.articles = cache.articles.filter(a => a.id !== id);
  }

  async function reactToArticle(id, newType) {
    const visitor = getVisitor();
    if (!visitor) throw new Error('Please sign in to react.');
    const { db } = fb();
    const ref = db.collection('articles').doc(id);
    await db.runTransaction(async tx => {
      const doc = await tx.get(ref);
      if (!doc.exists) return;
      const data = doc.data();
      const reactions = data.reactions || {};
      const current = reactions[visitor.id];
      if (current && current.type === newType) {
        delete reactions[visitor.id];
      } else if (newType) {
        reactions[visitor.id] = { type: newType, userName: visitor.userName, at: Date.now() };
      } else {
        delete reactions[visitor.id];
      }
      tx.update(ref, { reactions });
    });
    const fresh = await ref.get();
    const idx = cache.articles.findIndex(a => a.id === id);
    if (idx >= 0 && fresh.exists) cache.articles[idx] = Object.assign({ id }, fresh.data());
  }

  async function commentOnArticle(id, text) {
    const visitor = getVisitor();
    if (!visitor) throw new Error('Please sign in to comment.');
    const { db } = fb();
    const ref = db.collection('articles').doc(id);
    const comment = {
      id: uid(),
      userId: visitor.id,
      userName: visitor.userName,
      text,
      createdAt: Date.now()
    };
    await ref.update({
      comments: firebase.firestore.FieldValue.arrayUnion(comment)
    });
    const idx = cache.articles.findIndex(a => a.id === id);
    if (idx >= 0) {
      cache.articles[idx].comments = cache.articles[idx].comments || [];
      cache.articles[idx].comments.push(comment);
    }
    return comment;
  }

  // Counts reactions of a given type, supporting both legacy and new shape.
  function countReactionsOfType(reactions, type) {
    if (!reactions) return 0;
    if (typeof reactions[type] === 'number') return reactions[type]; // legacy {like, dislike}
    let n = 0;
    for (const k of Object.keys(reactions)) {
      const v = reactions[k];
      if (v && typeof v === 'object' && v.type === type) n++;
    }
    return n;
  }

  function getVisitorReaction(reactions) {
    const v = getVisitor();
    if (!v || !reactions) return null;
    const entry = reactions[v.id];
    return entry && entry.type ? entry.type : null;
  }

  // ---- Projects ----
  async function saveProject(project) {
    const { db } = fb();
    if (!project.id) project.id = uid();
    const { id, ...rest } = project;
    if (!rest.createdAt) rest.createdAt = Date.now();
    rest.updatedAt = Date.now();
    await db.collection('projects').doc(id).set(rest);
    const idx = cache.projects.findIndex(p => p.id === id);
    const fresh = Object.assign({ id }, rest);
    if (idx >= 0) cache.projects[idx] = fresh;
    else cache.projects.push(fresh);
    return fresh;
  }
  async function deleteProject(id) {
    const { db } = fb();
    await db.collection('projects').doc(id).delete();
    cache.projects = cache.projects.filter(p => p.id !== id);
  }

  // ---- Images (base64 in Firestore, no Storage required) ----
  // Compresses to JPEG data URL. Targets Firestore 1MB doc limit.
  function compressToDataUrl(file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
            else { width = Math.round(width * (maxDim / height)); height = maxDim; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Returns a base64 data URL. Loops with shrinking quality if too large.
  async function uploadImage(file, prefix, maxDim, quality) {
    const targetBytes = 700 * 1024; // ~700KB cap, leaves headroom in 1MB doc
    let dim = maxDim || 1200;
    let q = quality || 0.8;
    let url = await compressToDataUrl(file, dim, q);
    // Rough byte estimate: base64 is ~4/3 of binary size
    let bytes = Math.floor((url.length - 'data:image/jpeg;base64,'.length) * 0.75);
    let attempts = 0;
    while (bytes > targetBytes && attempts < 5) {
      if (q > 0.4) q -= 0.12;
      else dim = Math.max(400, Math.round(dim * 0.8));
      url = await compressToDataUrl(file, dim, q);
      bytes = Math.floor((url.length - 'data:image/jpeg;base64,'.length) * 0.75);
      attempts++;
    }
    return url;
  }

  // ---- Visitor auth (email + username, stored in /users collection) ----
  const visitorListeners = [];

  function getVisitor() {
    try { return JSON.parse(localStorage.getItem(VISITOR_KEY) || 'null'); }
    catch { return null; }
  }

  function onVisitorChange(cb) {
    visitorListeners.push(cb);
    try { cb(getVisitor()); } catch (e) {}
  }

  function emitVisitorChange() {
    const v = getVisitor();
    visitorListeners.forEach(cb => { try { cb(v); } catch (e) {} });
  }

  function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  async function signInVisitor(email, userName) {
    email = (email || '').trim().toLowerCase();
    userName = (userName || '').trim();
    if (!email) throw new Error('Email is required.');
    if (!isValidEmail(email)) throw new Error('Please enter a valid email address.');

    const { db } = fb();
    const snap = await db.collection('users').where('email', '==', email).limit(1).get();
    let user;
    if (snap.empty) {
      if (!userName) throw new Error('First-time sign-in needs a username.');
      const doc = await db.collection('users').add({
        email, userName, createdAt: Date.now()
      });
      user = { id: doc.id, email, userName, createdAt: Date.now() };
    } else {
      const d = snap.docs[0];
      user = Object.assign({ id: d.id }, d.data());
    }
    localStorage.setItem(VISITOR_KEY, JSON.stringify(user));
    emitVisitorChange();
    return user;
  }

  function signOutVisitor() {
    localStorage.removeItem(VISITOR_KEY);
    emitVisitorChange();
  }

  // ---- Seed defaults to Firestore (admin one-time setup) ----
  async function seedDefaults() {
    cache = clone(DEFAULT_DATA);
    await saveSiteContent();
  }

  // ---- Import/export ----
  async function importData(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid data');
    cache.profile = data.profile || cache.profile;
    cache.experience = data.experience || cache.experience;
    cache.education = data.education || cache.education;
    cache.languages = data.languages || cache.languages;
    cache.skills = data.skills || cache.skills;
    cache.cvProjects = data.cvProjects || cache.cvProjects;
    cache.recommendations = data.recommendations || cache.recommendations;
    await saveSiteContent();

    // Replace articles
    const { db } = fb();
    const oldArticles = cache.articles.slice();
    for (const a of oldArticles) {
      await db.collection('articles').doc(a.id).delete();
    }
    cache.articles = [];
    if (Array.isArray(data.articles)) {
      for (const a of data.articles) await saveArticle(a);
    }

    // Replace projects
    const oldProjects = cache.projects.slice();
    for (const p of oldProjects) {
      await db.collection('projects').doc(p.id).delete();
    }
    cache.projects = [];
    if (Array.isArray(data.projects)) {
      for (const p of data.projects) await saveProject(p);
    }
  }

  global.MajdData = {
    init, load, uid,
    // admin auth
    isLoggedIn, onAuthChange, login, logout, changePassword,
    // visitor auth
    getVisitor, onVisitorChange, signInVisitor, signOutVisitor,
    // content
    saveSiteContent,
    saveArticle, deleteArticle, reactToArticle, commentOnArticle,
    saveProject, deleteProject,
    uploadImage,
    countReactionsOfType, getVisitorReaction,
    seedDefaults, importData,
    DEFAULTS: DEFAULT_DATA
  };
})(window);