// TODO: fix
import { mountComponent } from 'teen-dom'

class Component {
  constructor(props = {}) {
    this.state = {}
    this.props = props
  }

  setState(value) {
    Object.assign(this.state, value)
    mountComponent(this)
  }
}

export default Component
