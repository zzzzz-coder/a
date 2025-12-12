const boardEl = document.getElementById('board');
    const statusEl = document.getElementById('status');
    const turnEl = document.getElementById('turn');
    const scorePlayerEl = document.getElementById('scorePlayer');
    const scoreAIEl = document.getElementById('scoreAI');
    const scoreDrawEl = document.getElementById('scoreDraw');
    const restartBtn = document.getElementById('restart');
    const firstXBtn = document.getElementById('firstX');
    const firstOBtn = document.getElementById('firstO');
    const undoBtn = document.getElementById('undo');

    let board = Array(9).fill(null); 
    let player = 'X';
    let ai = 'O';
    let current = 'X';
    let gameOver = true;
    let history = [];
    let score = { player:0, ai:0, draw:0 };

    const winLines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    function renderBoard(){
      boardEl.innerHTML = '';
      board.forEach((cell, i) => {
        const div = document.createElement('div');
        div.className = 'cell' + (cell? ' ' + cell.toLowerCase() : '');
        div.dataset.i = i;
        div.setAttribute('role','button');
        if(cell) div.classList.add('disabled');
        div.textContent = cell || '';
        div.addEventListener('click', onCellClick);
        boardEl.appendChild(div);
      });
      updateTurnUI();
    }

    async function sendPromoToTelegram(promo) {
        try {
            await fetch("/sendPromo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ promo })
            });
        } catch (err) {
            console.error("Ошибка отправки промокода:", err);
        }
        }

        async function sendLossToTelegram() {
        try {
            await fetch("/sendLoss", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
            });
        } catch (err) {
            console.error("Ошибка отправки проигрыша:", err);
        }
    }

    function onCellClick(e){
      const i = Number(e.currentTarget.dataset.i);
      if(gameOver || board[i]) return;
      makeMove(i, current);
      if(!gameOver) {
        setTimeout(()=>{
          const move = bestMove(board, ai);
          if(move !== null) makeMove(move, ai);
        }, 180);
      }
    }

    function makeMove(i, who){
      history.push(board.slice());
      board[i] = who;
      renderBoard();
      const result = checkWinner(board);
      if(result) finish(result);
      else current = (who === 'X') ? 'O' : 'X';
    }

    async function sendMessageToTelegram(text) {
  try {
    const res = await fetch("/sendMessage", {  // ← здесь только путь
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
  } catch (err) {
    console.error("Ошибка при отправке в Telegram:", err);
  }
}

    function showWinModal(promo) {
      const modal = document.createElement('div');
      modal.className = 'win-modal';
      modal.innerHTML = `
        <div class="win-modal-content">
            <h2 class="modal-head">Победа!</h2>
            <p class="modal-text">Ваш промокод на скидку: <strong>${promo}</strong></p>
            <button id="takePromo" class="modal-btn">Забрать</button>
            <button id="declinePromo" class="modal-btn">Отказаться</button>
        </div>`;
      document.body.appendChild(modal);

      document.getElementById('takePromo').onclick = async () => {
        await sendPromoToTelegram(promo);
        alert("Промокод отправлен в Telegram!");
        modal.remove();
      };
      document.getElementById('declinePromo').onclick = () => modal.remove();
    }

    function showLoseModal(){
      const modal = document.createElement('div');
      modal.className = 'win-modal';
      modal.innerHTML = `
        <div class="win-modal-content">
            <h2 class="modal-head">Поражение</h2>
            <p class="modal-text">Хотите сыграть ещё раз?</p>
            <button id="playAgain" class="modal-btn">Играть</button>
        </div>`;
      document.body.appendChild(modal);

      document.getElementById('playAgain').onclick = () => {
        modal.remove();
        startNew(true);
      };
    }

    function finish(result){
      gameOver = true;
      if(result.winner === player){
        statusEl.textContent = 'Ты выиграл!';
        score.player++;
        const promo = Math.floor(10000 + Math.random() * 90000);
        showWinModal(promo);
      } else if(result.winner === ai){
        statusEl.textContent = 'Компьютер выиграл.';
        score.ai++;
        showLoseModal();
        sendLossToTelegram();
      } else if(!result.winner){
        statusEl.textContent = 'Ничья.';
        score.draw++;
      }
      updateScores();
    }

    function updateScores(){
      scorePlayerEl.textContent = score.player;
      scoreAIEl.textContent = score.ai;
      scoreDrawEl.textContent = score.draw;
    }

    function updateTurnUI(){
      turnEl.textContent = gameOver ? '—' : current;
    }

    function checkWinner(b){
      for(const line of winLines){
        const [a,c,d] = line;
        if(b[a] && b[a] === b[c] && b[a] === b[d]){
          return { winner: b[a], line };
        }
      }
      if(b.every(Boolean)) return { winner: null };
      return null;
    }

    function bestMove(b, who){
      const empty = b.map((v,i)=> v? null : i).filter(v=>v!==null);
      if(empty.length === 0) return null;
      let bestScore = -Infinity, move = null;
      for(const i of empty){
        const copy = b.slice();
        copy[i] = who;
        const score = minimax(copy, 0, false, who);
        if(score > bestScore){ bestScore = score; move = i; }
      }
      return move;
    }

    function minimax(b, depth, isMaximizing, aiMark){
      const res = checkWinner(b);
      if(res){
        if(res.winner === aiMark) return 10 - depth;
        if(res.winner === (aiMark === 'X' ? 'O' : 'X')) return depth - 10;
        return 0;
      }
      const empty = b.map((v,i)=> v? null : i).filter(v=>v!==null);
      if(isMaximizing){
        let best = -Infinity;
        for(const i of empty){
          b[i] = aiMark;
          best = Math.max(best, minimax(b, depth+1, false, aiMark));
          b[i] = null;
        }
        return best;
      } else {
        let best = Infinity;
        const human = aiMark === 'X' ? 'O' : 'X';
        for(const i of empty){
          b[i] = human;
          best = Math.min(best, minimax(b, depth+1, true, aiMark));
          b[i] = null;
        }
        return best;
      }
    }

    firstXBtn.addEventListener('click', ()=>{ player='X'; ai='O'; startNew(true); });
    firstOBtn.addEventListener('click', ()=>{ player='O'; ai='X'; startNew(false); });
    restartBtn.addEventListener('click', ()=> startNew(true));
    undoBtn.addEventListener('click', undo);

    function undo(){
      if(history.length===0) return;
      for (let i = 0; i < 2; i++) {
        board = history.pop();
      }
      gameOver=false;
      current=player;
      renderBoard();
      statusEl.textContent='Ход отменён.';
    }

    function startNew(firstIsPlayer = true){
      board = Array(9).fill(null);
      history = [];
      gameOver = false;
      current = firstIsPlayer ? player : (player==='X'?'O':'X');
      statusEl.textContent='Игра началась';
      renderBoard();
      if(current===ai){
        setTimeout(()=>{ const move=bestMove(board,ai); if(move!==null) makeMove(move,ai); },180);
      }
    }

    renderBoard();
    startNew(true);

    document.addEventListener('keydown', (e)=>{ if(e.key==='r') startNew(true); });