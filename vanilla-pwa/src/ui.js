import { EVENT } from './data.js';

export function createUI() {
  const elements = Object.fromEntries([...document.querySelectorAll('[id]')].map((element) => [element.id, element]));
  elements['event-name'].textContent = EVENT.name;
  elements['event-date'].textContent = EVENT.date;

  function renderParticipants(participants) {
    const query = elements.search.value.trim().toLocaleLowerCase('it-IT');
    const filtered = participants.filter((person) => `${person.name} ${person.id}`.toLocaleLowerCase('it-IT').includes(query));
    elements['list-count'].textContent = `${filtered.length} di ${participants.length}`;
    elements['empty-list'].hidden = filtered.length > 0;
    elements.participants.replaceChildren(...filtered.map((person) => {
      const row = document.createElement('li');
      row.className = `person${person.checkedIn ? ' is-present' : ''}`;
      row.dataset.id = person.id;
      const avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = person.name.split(' ').map((part) => part[0]).join('');
      const details = document.createElement('div');
      details.className = 'person-details';
      const name = document.createElement('strong');
      name.textContent = person.name;
      const id = document.createElement('span');
      id.className = 'person-id';
      id.textContent = person.id;
      details.append(name, id);
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = person.checkedIn ? '✓ Presente' : 'In attesa';
      row.append(avatar, details, badge);
      return row;
    }));
  }

  function render(state) {
    const present = state.participants.filter((person) => person.checkedIn).length;
    elements.count.textContent = state.ready ? `${present} / ${state.participants.length} presenti` : 'Presenze non disponibili';
    elements.waiting.textContent = state.ready ? `${state.participants.length - present} in attesa` : 'Riprova il caricamento';
    elements.progress.value = present;
    elements.progress.max = state.participants.length;
    elements['open-scanner'].disabled = !state.ready;
    elements.code.disabled = !state.ready;
    elements.submit.disabled = !state.ready || !elements.code.value.trim();
    elements.retry.hidden = state.ready;
    if (state.feedback) {
      elements.feedback.className = `feedback ${state.feedback.tone}`;
      // A new node also announces repeated, identical results to assistive technology.
      const message = document.createElement('span');
      message.textContent = state.feedback.message;
      elements.feedback.replaceChildren(message);
    } else elements.feedback.replaceChildren();
    renderParticipants(state.participants);
  }
  return { elements, render, renderParticipants };
}
