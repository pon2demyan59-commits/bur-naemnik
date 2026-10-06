import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist/vendor', { recursive: true });
await Promise.all([
  cp('index.html', 'dist/index.html'), cp('src', 'dist/src', { recursive: true }),
  cp('public/assets', 'dist/assets', { recursive: true }),
  cp('node_modules/phaser/dist/phaser.min.js', 'dist/vendor/phaser.min.js'),
]);
console.log('Готово: dist/ — автономная сборка, Phaser и изображения включены.');
