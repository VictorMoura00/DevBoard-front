# DevBoard UI

Biblioteca visual interna do projeto.

## Objetivo

Concentrar os componentes standalone reutilizaveis e os padroes visuais retro do DevBoard.

## Componentes atuais

- `RetroButtonComponent`
- `RetroModalComponent`
- `RetroWindowComponent`
- `StatusPillComponent`
- `StatBoxComponent`
- `ToolbarSearchComponent`
- `ProjectCardComponent`

## Diretrizes

- Todo componente novo deve ser `standalone`.
- Preferir tokens globais de tema em `src/styles.scss`.
- Evitar estilos de UI diretamente em paginas quando o padrao puder ser reutilizado.
- Exportar novos componentes em `src/app/shared/ui/index.ts`.

## Ordem sugerida de crescimento

1. `RetroInputComponent`
2. `RetroSelectComponent`
3. `RetroBadgeComponent`
4. `RetroToastComponent`
5. `RetroFormFieldComponent`
