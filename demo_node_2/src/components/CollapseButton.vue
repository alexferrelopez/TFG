<template>
  <button
    class="arrow-btn"
    :class="{ 'arrow-btn--flipped': isFlipped }"
    @click="handleClick"
    aria-label="Toggle Arrow"
  >
    <img src="@/assets/arrow_left.svg" alt="Arrow" />
  </button>
</template>

<script>
export default {
  name: 'ArrowButton',
  data() {
    return {
      isFlipped: false,
    };
  },
  methods: {
    handleClick() {
      this.isFlipped = !this.isFlipped;
      this.$emit('toggle', this.isFlipped);
    },
  },
};
</script>

<style scoped>
.arrow-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 48px;
  padding: 0;
  border: 0;
  background-color: #fff;
  border-radius: 0 6px 6px 0;
  box-shadow: 0 1px 2px rgba(60,64,67,0.3),0 2px 6px 2px rgba(60,64,67,0.15);
  cursor: pointer;
  transition: transform 0.2s ease;
}
.arrow-btn img {
  display: block;
  width: 24px;
  height: 24px;
  transition: transform 0.3s ease;
}
.arrow-btn--flipped img {
  transform: rotate(180deg);
}
.arrow-btn:focus {
  outline: none;
}
.arrow-btn:hover {
  background-color: #f5f5f5;
}
</style>
