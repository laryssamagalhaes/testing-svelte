<script>
  import Input from './components/Input.svelte';
  import Button from './components/Button.svelte';

  let firstNameProps = {
    placeholder: 'first name',
    name: 'firstName',
    label: 'First name:',
    value: ''
  }

  let lasttNameProps = {
    placeholder: 'last name',
    name: 'lastName',
    label: 'Last name:',
    value: ''
  }

  let ageProps = {
    placeholder: 'age',
    name: 'age',
    label: 'Age:',
    value: ''
  }

  const buttonProps = {
    content: "Send data",
    onClick: () => {
      alert(`
        Name: ${firstNameProps.value}
        Last name: ${lasttNameProps.value} 
        Age: ${ageProps.value}
      `)
    }
  }

  const getValueInput = (variableToUpate) => (value) => {
   variableToUpate.value = value
  }
</script>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100vh;
  }
</style>

<div class="container">
  <Input {...firstNameProps} onChange={getValueInput(firstNameProps)} />
  <Input {...lasttNameProps} onChange={getValueInput(lasttNameProps)} />
  <Input {...ageProps} onChange={getValueInput(ageProps)} />
  <Button {...buttonProps} />
</div>
