// Static Assets Handler for Cloudflare Workers
import { WorkerRequest, WorkerEnvironment, ExecutionContext } from '../../types/worker-configuration';

export async function handleStaticAssets(
  request: WorkerRequest,
  env: WorkerEnvironment,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle different asset types
  if (path.endsWith('.js')) {
    return handleJavaScript(request, env);
  }
  
  if (path.endsWith('.css')) {
    return handleCSS(request, env);
  }
  
  if (path.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
    return handleImages(request, env);
  }
  
  if (path.match(/\.(woff|woff2|ttf|eot)$/)) {
    return handleFonts(request, env);
  }

  // Default 404 for unknown assets
  return new Response('Asset not found', { status: 404 });
}

async function handleJavaScript(
  request: WorkerRequest,
  env: WorkerEnvironment
): Promise<Response> {
  // In production, this would serve actual JS files from R2 or KV
  return new Response('// JavaScript content', {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=31536000',
      'ETag': '"js-etag"'
    }
  });
}

async function handleCSS(
  request: WorkerRequest,
  env: WorkerEnvironment
): Promise<Response> {
  // In production, this would serve actual CSS files from R2 or KV
  return new Response('/* CSS content */', {
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=31536000',
      'ETag': '"css-etag"'
    }
  });
}

async function handleImages(
  request: WorkerRequest,
  env: WorkerEnvironment
): Promise<Response> {
  // In production, this would serve actual images from R2
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Determine content type
  let contentType = 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
    contentType = 'image/jpeg';
  } else if (path.endsWith('.gif')) {
    contentType = 'image/gif';
  } else if (path.endsWith('.svg')) {
    contentType = 'image/svg+xml';
  } else if (path.endsWith('.ico')) {
    contentType = 'image/x-icon';
  }

  return new Response('', {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
      'ETag': '"img-etag"'
    }
  });
}

async function handleFonts(
  request: WorkerRequest,
  env: WorkerEnvironment
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Determine content type
  let contentType = 'font/woff2';
  if (path.endsWith('.woff')) {
    contentType = 'font/woff';
  } else if (path.endsWith('.ttf')) {
    contentType = 'font/ttf';
  } else if (path.endsWith('.eot')) {
    contentType = 'application/vnd.ms-fontobject';
  }

  return new Response('', {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
      'ETag': '"font-etag"'
    }
  });
}