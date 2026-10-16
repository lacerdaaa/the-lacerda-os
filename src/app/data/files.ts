import { AppLanguage } from '../core/i18n';
import { PROFILE, PROFILE_PARAGRAPHS, SkillBadge, SKILLS } from './profile';

export type FileId = 'about-me.txt' | 'readme.txt';

export interface DesktopFile {
  id: FileId;
  content: (language: AppLanguage) => string;
  attachments: SkillBadge[];
}

const README: Record<AppLanguage, string> = {
  'en-US': [
    'Welcome to lacOs!',
    '',
    'This is my portfolio, dressed up as a classic Mac.',
    '',
    'Tips',
    '- Double-click desktop icons to open them (a single tap on phones).',
    '- Drag windows by the title bar. Double-click it to collapse (WindowShade).',
    '- The box on the left closes a window; the boxes on the right zoom and minimize.',
    '- Right-click the desktop, icons and the dock for more options.',
    '- Menus at the top work too: try View > Theme or Go.',
    '- Open the Terminal and type "help". There are games in there.',
    '- Ace the Quiz without mistakes to unlock a secret.',
    '',
    'Built with Angular. Source: ' + PROFILE.githubLabel + '/the-lacerda-os'
  ].join('\n'),
  'pt-BR': [
    'Bem-vindo ao lacOs!',
    '',
    'Este é o meu portfólio, vestido de Mac clássico.',
    '',
    'Dicas',
    '- Dê dois cliques nos ícones da mesa para abrir (um toque no celular).',
    '- Arraste janelas pela barra de título. Dois cliques nela recolhem a janela (WindowShade).',
    '- A caixa da esquerda fecha a janela; as da direita ampliam e minimizam.',
    '- Clique com o botão direito na mesa, nos ícones e na dock para mais opções.',
    '- Os menus no topo funcionam: experimente Visualizar > Tema ou Ir.',
    '- Abra o Terminal e digite "help". Tem jogos lá dentro.',
    '- Acerte o Quiz sem erros para desbloquear um segredo.',
    '',
    'Feito com Angular. Código: ' + PROFILE.githubLabel + '/the-lacerda-os'
  ].join('\n')
};

export const FILES: Record<FileId, DesktopFile> = {
  'about-me.txt': {
    id: 'about-me.txt',
    content: (language) =>
      [PROFILE.name, ...PROFILE_PARAGRAPHS[language], `GitHub: ${PROFILE.githubLabel}`].join('\n\n'),
    attachments: SKILLS
  },
  'readme.txt': {
    id: 'readme.txt',
    content: (language) => README[language],
    attachments: []
  }
};

export function findFile(name: string): DesktopFile | undefined {
  const normalized = name.trim().toLowerCase();
  return Object.values(FILES).find((file) => file.id === normalized);
}
