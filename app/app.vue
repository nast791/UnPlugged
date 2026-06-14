<template>
  <div>
    <Html
      lang="ru"
      class="overflow-x-hidden scroll-smooth max-h-dvh"
    />
    <Head>
      <Title>{{ route.meta?.seo?.title }}</Title>
      <Meta name="robots" content="noindex" />
    </Head>
    <Body
      class="-tracking-[0.01em] leading-[1.2] text-primary text-18 bg-white overflow-x-clip min-w-360 lining-nums scroll-smooth outline-none font-display font-normal max-h-dvh"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup>
const route = useRoute();
</script>
