// TODO: fix
import { updateComponent } from 'teen-dom'

class Component {
  constructor(props = {}) {
    this.state = {}
    this.props = props
  }

  setState(value) {
    Object.assign(this.state, value)
    updateComponent(this)
  }
}

export default Component
