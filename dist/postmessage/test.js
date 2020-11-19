

const btn = document.getElementById('sendBtn');
const input = document.getElementById('input');
const textArea = document.getElementById('message');

btn.addEventListener('click', ()=>{
  if (!input.value) return;
  window.postContainerMessage(input.value, 'app3');
  input.value = '';
})

window.addEventListener('container-message', (event)=>{
  const message = event.data;
  if (!message) return;

  textArea.value = textArea.value + `\n${message}`;
});


