<script>
  export let content, onClick;
</script>

<style>
  button {
    padding: 12px 20px;  
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
    font-size: 15px;
  }
   button:hover {
    background: #E0E0E0;
  }
</style>


<button on:click={onClick}>{content}</button>