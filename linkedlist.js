class LinkedList {
    head = {}
    tail = this.head
    length = 0
    constructor(data) {
        for(let item of data) {
            this.push(item)
        }
    }

    push(item) {
        this.tail.cur = item
        this.tail.next = {}
        this.tail = this.tail.next
        this.length++
    }

    shift() {
        if(!this.head.cur) {
            return undefined
        }
        this.length--
        let item = this.head.cur
        this.head = this.head.next
        return item
    }
}