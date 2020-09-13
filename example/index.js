import Teen from 'teen'
import TeenDom from 'teen-dom'

const Functional = (props) => (
  <p>
    my name is {props.name}, I'm {props.age} years old
  </p>
)

class Count extends Teen.Component {
  constructor(props) {
    super(props)
    this.state = {
      count: props.start,
      color: 'green',
    }
    this.handleAdd = this.add.bind(this)
    this.handleSubstract = this.substract.bind(this)
    this.changeRed = this.changeRed.bind(this)
  }
  add() {
    this.setState({
      count: this.state.count + 1,
      color: 'green',
    })
  }

  substract() {
    this.setState({
      count: this.state.count - 1,
      color: 'pink',
    })
  }

  changeRed() {
    this.setState({
      color: 'red',
    })
  }

  render() {
    return (
      <div>
        <h5 style={{ color: this.state.color }}>{this.state.count}</h5>
        <button onClick={this.handleAdd}>add</button>
        <button onClick={this.handleSubstract}>substract</button>
        <button onClick={this.changeRed}>red</button>
      </div>
    )
  }
}

class FormItem extends Teen.Component {
  constructor(props) {
    super(props)
    this.state = {
      name: '',
    }
    this.handleNameChange = this.changeName.bind(this)
  }
  changeName(e) {
    this.setState({
      name: e.target.value,
    })
  }
  render() {
    return (
      <div>
        <p>value: {this.state.name}</p>
        <input value={this.state.name} onInput={this.handleNameChange} />
      </div>
    )
  }
}

const App = (
  <div>
    <section>
      <h3>1. base case</h3>
      <p>hello world</p>
    </section>

    <section>
      <h3>2. dom with attribute and event</h3>
      <p id="abc" style="color: red">
        你好呀
      </p>
      <div
        style={{ width: '50px', height: '50px', 'background-color': 'pink' }}
      ></div>
      <button onClick={(e) => alert('clicked')}>click</button>
    </section>
    <section>
      <h3>3. component</h3>
      <Functional name="colgin" age={12} />
      <Count start={4} />
      <FormItem />
    </section>
  </div>
)

console.log(App)

TeenDom.render(App, document.getElementById('app'))
