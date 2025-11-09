// netlify/functions/save-perro.js
exports.handler = async (event) => {
  const { Octokit } = await import("@octokit/core");

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    const { nombrePerro, datosPerro } = payload;

    if (!nombrePerro || !datosPerro) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'Faltan nombrePerro o datosPerro' })
      };
    }

    const owner = "pesaher"; // tu usuario
    const repo  = "perros";  // tu repo
    const path  = `archivos/perros/${nombrePerro}.json`;

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // Obtener sha actual si existe
    let sha = null;
    try {
      const res = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner, repo, path
      });
      sha = res.data.sha;
    } catch (err) {
      if (err.status !== 404) throw err;
    }

    const content = Buffer.from(JSON.stringify(datosPerro, null, 2)).toString('base64');

    const params = {
      owner,
      repo,
      path,
      message: `[skip netlify] ${sha ? 'Actualiza' : 'Crea'} perro: ${nombrePerro}`,
      content,
      committer: { name: 'Web App', email: 'no-reply@webapp.local' },
      sha
    };

    const resp = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', params);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        commit: resp.data.commit.html_url,
        action: sha ? 'actualizado' : 'creado'
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
