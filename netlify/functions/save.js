// netlify/functions/save.js
const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body); // contenido enviado desde tu web
    const owner = "pesaher"; // tu usuario o el del repo
    const repo  = "perros";  // nombre exacto del repo
    const path  = "archivos/cheniles.json";

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // Obtener el sha actual
    let sha = null;
    try {
      const res = await octokit.repos.getContent({ owner, repo, path });
      sha = res.data.sha;
    } catch (err) {
      if (err.status !== 404) throw err;
    }

    const content = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');

    const params = {
      owner,
      repo,
      path,
      message: 'Actualiza cheniles vía web',
      content,
      committer: { name: 'Web App', email: 'no-reply@webapp.local' }
    };
    if (sha) params.sha = sha;

    const resp = await octokit.repos.createOrUpdateFileContents(params);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, commit: resp.data.commit.html_url })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
