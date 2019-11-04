<script>
  export let name, label, placeholder, value, onChange;
</script>

<style>
input {
  border-radius: 4px;
  padding: 10px;
  width: 200px;
}

label {
  margin-bottom: 5px;
}

input, label {
  font-size: 13px;
}
</style>

<div>
  <label>{label}</label>
  <input 
    name={name} 
    placeholder={`Write your ${placeholder} here`} 
    bind:value={value} 
    on:change={() => onChange(value)
  }/>
</div>