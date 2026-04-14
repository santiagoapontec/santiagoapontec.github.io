const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const sections = {
  writing: {
    title: 'Writing',
    subtitle: 'A collection of original essays on varying topics',
    page: '../writing.html'
  },
  daily: {
    title: 'Daily',
    subtitle: 'An actual record so that I can\'t lie on podcasts down the road...',
    page: '../daily.html'
  }
};

function buildNotes() {
  const notesDir = path.join(__dirname, 'posts/notes');
  const files = fs.readdirSync(notesDir).filter(f => f.endsWith('.md'));
  const notes = [];

  // Process each markdown file
  files.forEach(file => {
    const raw = fs.readFileSync(path.join(notesDir, file), 'utf8');
    const { data, content } = matter(raw);

    // Handle footnotes
    const footnotes = [];
    let footnoteIndex = 0;
    const contentWithFootnotes = content.replace(/\^\[([^\]]+)\]/g, (match, footnoteText) => {
      footnoteIndex++;
      footnotes.push({ id: footnoteIndex, text: marked.parseInline(footnoteText) });
      return `<sup>${footnoteIndex}</sup>`;
    });

    const htmlContent = marked(contentWithFootnotes);
    const slug = file.replace('.md', '');

    // Build footnotes HTML
    let footnotesHtml = '';
    if (footnotes.length > 0) {
      footnotesHtml = footnotes.map(f =>
        `<p class="footnote">(${f.id}) ${f.text}</p>`
      ).join('\n');
    }

    // Save as JSON
    const noteData = {
      title: data.title,
      date: data.date,
      content: htmlContent,
      footnotes: footnotesHtml,
      slug: slug
    };

    const outputDir = path.join(__dirname, 'notes-data');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    fs.writeFileSync(
      path.join(outputDir, slug + '.json'),
      JSON.stringify(noteData, null, 2)
    );

    notes.push({ title: data.title, date: data.date, slug });
  });

  // Sort notes by date, newest first
  notes.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group notes by year
  const byYear = {};
  notes.forEach(note => {
    const year = new Date(note.date).getFullYear();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(note);
  });

  // Generate the list HTML
  let listHtml = '<div class="post-list">\n';

  Object.keys(byYear).sort((a, b) => b - a).forEach(year => {
    listHtml += `  <section>\n    <h2>${year}</h2>\n    <ul>\n`;
    const yearNotes = byYear[year];

    yearNotes.forEach((note, index) => {
      const currentMonth = new Date(note.date).getMonth();
      const nextNote = yearNotes[index + 1];
      const nextMonth = nextNote ? new Date(nextNote.date).getMonth() : null;
      const isMonthEnd = nextMonth !== null && currentMonth !== nextMonth;
      const monthEndClass = isMonthEnd ? ' class="month-end"' : '';

      const dateParts = note.date.split('/');
      const shortDate = dateParts[0] + '/' + dateParts[1];
      listHtml += `      <li${monthEndClass} data-note="${note.slug}"><span class="title">${note.title}</span><span class="date">${shortDate}</span></li>\n`;
    });

    listHtml += `    </ul>\n  </section>\n`;
  });

  listHtml += '</div>';

  // Inject into notes.html
  const notesHtmlPath = path.join(__dirname, 'notes.html');
  let notesHtml = fs.readFileSync(notesHtmlPath, 'utf8');
  notesHtml = notesHtml.replace(
    /<!-- NOTES-LIST-START -->[\s\S]*?<!-- NOTES-LIST-END -->/,
    `<!-- NOTES-LIST-START -->\n  ${listHtml}\n  <!-- NOTES-LIST-END -->`
  );
  fs.writeFileSync(notesHtmlPath, notesHtml);

  console.log('Built ' + notes.length + ' notes:');
  notes.forEach(n => console.log(' - ' + n.title + ' (' + n.date + ')'));
  console.log('Done! notes.html has been updated.');
}

function buildWriting() {
  const writingDir = path.join(__dirname, 'posts/writing');
  const outputDir = path.join(__dirname, 'writing-posts');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const template = fs.readFileSync(path.join(__dirname, 'post.html'), 'utf8');
  const files = fs.readdirSync(writingDir).filter(f => f.endsWith('.md'));
  const posts = [];

  files.forEach(file => {
    const raw = fs.readFileSync(path.join(writingDir, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = file.replace('.md', '');
    const footnotes = [];
    let footnoteIndex = 0;
    const contentWithFootnotes = content.replace(/\^\[([^\]]+)\]/g, (match, footnoteText) => {
      footnoteIndex++;
      footnotes.push({ id: footnoteIndex, text: marked.parseInline(footnoteText) });
      return `<sup>${footnoteIndex}</sup>`;
    });

    const htmlContent = marked(contentWithFootnotes);

    let footnotesHtml = '';
    if (footnotes.length > 0) {
      footnotesHtml = '\n<div class="footnotes">\n' +
        footnotes.map(f => `<p class="footnote">(${f.id}) ${f.text}</p>`).join('\n') +
        '\n</div>';
    }

    const section = sections.writing;
    let postHtml = template
      .replace('<!-- SECTION-TITLE -->', section.title)
      .replace('<!-- SECTION-SUBTITLE -->', section.subtitle)
      .replace('<!-- SECTION-PAGE -->', section.page)
      .replace('<!-- POST-TITLE -->', data.title)
      .replace('<!-- POST-SUBTITLE -->', data.subtitle || '')
      .replace('<!-- POST-BODY -->', htmlContent + footnotesHtml);

    fs.writeFileSync(path.join(outputDir, slug + '.html'), postHtml);
    posts.push({ title: data.title, date: data.date, slug });
  });

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group by year
  const byYear = {};
  posts.forEach(post => {
    const year = new Date(post.date).getFullYear();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(post);
  });

  // Generate list HTML
  let listHtml = '<div class="post-list">\n';
  Object.keys(byYear).sort((a, b) => b - a).forEach(year => {
    listHtml += `  <section>\n    <h2>${year}</h2>\n    <ul>\n`;
    const yearPosts = byYear[year];
    yearPosts.forEach((post, index) => {
      const currentMonth = new Date(post.date).getMonth();
      const nextPost = yearPosts[index + 1];
      const nextMonth = nextPost ? new Date(nextPost.date).getMonth() : null;
      const isMonthEnd = nextMonth !== null && currentMonth !== nextMonth;
      const monthEndClass = isMonthEnd ? ' class="month-end"' : '';
      const dateParts = post.date.split('/');
      const shortDate = dateParts[0] + '/' + dateParts[1];
      listHtml += `      <li${monthEndClass}><a href="writing-posts/${post.slug}.html"><span class="title">${post.title}</span><span class="date">${shortDate}</span></a></li>\n`;
    });
    listHtml += `    </ul>\n  </section>\n`;
  });
  listHtml += '</div>';

  // Inject into writing.html
  const writingHtmlPath = path.join(__dirname, 'writing.html');
  let writingHtml = fs.readFileSync(writingHtmlPath, 'utf8');
  writingHtml = writingHtml.replace(
    /<!-- WRITING-LIST-START -->[\s\S]*?<!-- WRITING-LIST-END -->/,
    `<!-- WRITING-LIST-START -->\n  ${listHtml}\n  <!-- WRITING-LIST-END -->`
  );
  fs.writeFileSync(writingHtmlPath, writingHtml);

  console.log('Built ' + posts.length + ' writing posts:');
  posts.forEach(p => console.log(' - ' + p.title + ' (' + p.date + ')'));
}

function buildDaily() {
  const dailyDir = path.join(__dirname, 'posts/daily');
  const outputDir = path.join(__dirname, 'daily-posts');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const template = fs.readFileSync(path.join(__dirname, 'post.html'), 'utf8');
  const files = fs.readdirSync(dailyDir).filter(f => f.endsWith('.md'));

  const reflections = files.filter(f => !f.includes('-pbp'));
  const playByPlays = files.filter(f => f.includes('-pbp'));

  const pbpDates = new Set(playByPlays.map(f => f.replace('-pbp.md', '')));
  const reflectionDates = new Set(reflections.map(f => f.replace('.md', '')));

  const entries = [];

  function buildPost(slug, content, data, nextSlug, nextLabel, noReflection) {
    const footnotes = [];
    let footnoteIndex = 0;
    const contentWithFootnotes = content.replace(/\^\[([^\]]+)\]/g, (match, footnoteText) => {
      footnoteIndex++;
      footnotes.push({ id: footnoteIndex, text: marked.parseInline(footnoteText) });
      return `<sup>${footnoteIndex}</sup>`;
    });

    const htmlContent = marked(contentWithFootnotes);

    let footnotesHtml = '';
    if (footnotes.length > 0) {
      footnotesHtml = '\n<div class="footnotes">\n' +
        footnotes.map(f => `<p class="footnote">(${f.id}) ${f.text}</p>`).join('\n') +
        '\n</div>';
    }

    // Build navigation HTML
    let navHtml = '';
    if (nextSlug) {
      navHtml = `<div class="post-nav"><a href="${nextSlug}.html" class="post-nav-link">${nextLabel} →</a></div>`;
    } else if (noReflection) {
      navHtml = `<div class="post-nav"><span style="font-size:13px; color:#bbb; font-style:italic;">No reflection written for this day</span></div>`;
    }

    const section = sections.daily;
    let postHtml = template
      .replace('<!-- SECTION-TITLE -->', section.title)
      .replace('<!-- SECTION-SUBTITLE -->', section.subtitle)
      .replace('<!-- SECTION-PAGE -->', section.page)
      .replace('<!-- POST-TITLE -->', data.title)
      .replace('<!-- POST-SUBTITLE -->', '')
      .replace('<!-- POST-BODY -->', htmlContent + footnotesHtml)
      .replace('<!-- POST-NAV -->', navHtml);

    fs.writeFileSync(path.join(outputDir, slug + '.html'), postHtml);
  }

  // Process play by plays first — these are the main entry points
  playByPlays.forEach(file => {
    const raw = fs.readFileSync(path.join(dailyDir, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = file.replace('.md', '');
    const dateKey = slug.replace('-pbp', '');

    const hasReflection = reflectionDates.has(dateKey);

    buildPost(
      slug,
      content,
      data,
      hasReflection ? dateKey : null,
      'Reflection',
      !hasReflection
    );

    // Add to calendar entries
    const d = new Date(data.date);
    const entryKey = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    entries.push({ date: data.date, entryKey });
  });

  // Process reflections — these are secondary, linked from pbp
  reflections.forEach(file => {
    const raw = fs.readFileSync(path.join(dailyDir, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = file.replace('.md', '');

    const hasPbp = pbpDates.has(slug);

    buildPost(
      slug,
      content,
      data,
      hasPbp ? slug + '-pbp' : null,
      '← Play by Play',
      false
    );

    // Only add to calendar if no pbp exists for this day
    if (!hasPbp) {
      const d = new Date(data.date);
      const entryKey = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      entries.push({ date: data.date, entryKey });
    }
  });

  // Update entries array in daily.html
  const entryKeys = entries.map(p => `'${p.entryKey}'`).join(', ');
  const dailyHtmlPath = path.join(__dirname, 'daily.html');
  let dailyHtml = fs.readFileSync(dailyHtmlPath, 'utf8');
  dailyHtml = dailyHtml.replace(
    /var entries = \[[\s\S]*?\]/,
    `var entries = [/* DAILY-ENTRIES */]`
  ).replace(
    /\/\* DAILY-ENTRIES \*\//,
    entryKeys
  );
  fs.writeFileSync(dailyHtmlPath, dailyHtml);

  console.log('Built ' + files.length + ' daily posts');
}

function buildLearning() {
  const learningDir = path.join(__dirname, 'posts/learning');
  const outputDir = path.join(__dirname, 'learning-posts');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const template = fs.readFileSync(path.join(__dirname, 'post.html'), 'utf8');
  const files = fs.readdirSync(learningDir).filter(f => f.endsWith('.md'));
  const posts = [];

  files.forEach(file => {
    const raw = fs.readFileSync(path.join(learningDir, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = file.replace('.md', '');

    const footnotes = [];
    let footnoteIndex = 0;
    const contentWithFootnotes = content.replace(/\^\[([^\]]+)\]/g, (match, footnoteText) => {
      footnoteIndex++;
      footnotes.push({ id: footnoteIndex, text: marked.parseInline(footnoteText) });
      return `<sup>${footnoteIndex}</sup>`;
    });

    const htmlContent = marked(contentWithFootnotes);

    let footnotesHtml = '';
    if (footnotes.length > 0) {
      footnotesHtml = '\n<div class="footnotes">\n' +
        footnotes.map(f => `<p class="footnote">(${f.id}) ${f.text}</p>`).join('\n') +
        '\n</div>';
    }

    let postHtml = template
      .replace('<!-- SECTION-TITLE -->', 'Learning')
      .replace('<!-- SECTION-SUBTITLE -->', 'Study journals for things I\'ve learnt / I\'m learning')
      .replace('<!-- SECTION-PAGE -->', '../learning.html')
      .replace('<!-- POST-TITLE -->', data.title)
      .replace('<!-- POST-SUBTITLE -->', '')
      .replace('<!-- POST-BODY -->', htmlContent + footnotesHtml);

    fs.writeFileSync(path.join(outputDir, slug + '.html'), postHtml);
    posts.push({
      title: data.title,
      category: data.category,
      journal: data.journal,
      journalTitle: data['journal-title'],
      order: data.order,
      journalOrder: data['journal-order'],
      date: data.date,
      slug
    });
  });

  // Group by category, then by journal
  const byCategory = {};
  posts.forEach(post => {
    if (!byCategory[post.category]) byCategory[post.category] = {};
    if (!byCategory[post.category][post.journal]) {
      byCategory[post.category][post.journal] = {
        title: post.journalTitle,
        date: post.date,
        journalOrder: post.journalOrder,
        parts: []
      };
    }
    byCategory[post.category][post.journal].parts.push(post);
  });

  // Sort parts within each journal by order
  Object.keys(byCategory).forEach(category => {
    Object.keys(byCategory[category]).forEach(journal => {
      byCategory[category][journal].parts.sort((a, b) => a.order - b.order);
    });
  });

  // Generate list HTML
  let listHtml = '<div class="post-list">\n';
  Object.keys(byCategory).sort().forEach(category => {
    listHtml += `  <section>\n    <h2>${category}</h2>\n    <ul>\n`;
    Object.keys(byCategory[category]).sort((a, b) => {
    return byCategory[category][a].journalOrder - byCategory[category][b].journalOrder;
    }).forEach(journal => {
      const j = byCategory[category][journal];
      const dateParts = j.date.split('/');
      const shortDate = 'Started on ' + dateParts[0] + '/' + dateParts[1];
      listHtml += `      <li class="expandable">\n`;
      listHtml += `        <div class="entry-header">\n`;
      listHtml += `          <span class="arrow">›</span>\n`;
      listHtml += `          <span class="title">${j.title}</span>\n`;
      listHtml += `          <span class="date">${shortDate}</span>\n`;
      listHtml += `        </div>\n`;
      listHtml += `        <ul class="sub-parts">\n`;
      j.parts.forEach(part => {
        const partDateParts = part.date.split('/');
        const partShortDate = partDateParts[0] + '/' + partDateParts[1];
        listHtml += `          <li onclick="window.location='learning-posts/${part.slug}.html'" style="cursor:pointer"><span class="title">${part.title}</span><span class="date">${partShortDate}</span></li>\n`;
      });
      listHtml += `        </ul>\n      </li>\n`;
    });
    listHtml += `    </ul>\n  </section>\n`;
  });
  listHtml += '</div>';

  // Inject into learning.html
  const learningHtmlPath = path.join(__dirname, 'learning.html');
  let learningHtml = fs.readFileSync(learningHtmlPath, 'utf8');
  learningHtml = learningHtml.replace(
    /<!-- LEARNING-LIST-START -->[\s\S]*?<!-- LEARNING-LIST-END -->/,
    `<!-- LEARNING-LIST-START -->\n  ${listHtml}\n  <!-- LEARNING-LIST-END -->`
  );
  fs.writeFileSync(learningHtmlPath, learningHtml);

  console.log('Built ' + posts.length + ' learning posts across ' + Object.keys(byCategory).length + ' categories:');
  Object.keys(byCategory).forEach(cat => {
    console.log(' ' + cat + ':');
    Object.keys(byCategory[cat]).forEach(j => {
      console.log('   - ' + byCategory[cat][j].title + ' (' + byCategory[cat][j].parts.length + ' parts)');
    });
  });
}

buildNotes();
buildWriting();
buildDaily();
buildLearning();
