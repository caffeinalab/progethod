<template>
  <div class="w-full bg-page py-10 pt-20">
    <div class="mx-auto container bg-card shadow rounded">
      <div class="hidden flex flex-col lg:flex-row p-4 lg:p-8 justify-between items-start lg:items-stretch w-full">
        <div class=" w-full lg:w-1/3 flex flex-col lg:flex-row items-start lg:items-center">
          <div class="flex items-center">
            <a class="text-ink-secondary p-2 border-transparent border bg-card-dim hover:bg-card-hover cursor-pointer rounded focus:outline-none focus:border-ink focus:shadow-outline-gray" href="javascript: void(0)">
              <edit-icon
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </a>
            <a class="text-ink-secondary mx-2 p-2 border-transparent border bg-card-dim hover:bg-card-hover cursor-pointer rounded focus:outline-none focus:border-ink focus:shadow-outline-gray" href="javascript: void(0)">
              <settings-icon
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </a>
            <a class="text-ink-secondary mr-2 p-2 border-transparent border bg-card-dim hover:bg-card-hover cursor-pointer rounded focus:outline-none focus:border-ink focus:shadow-outline-gray" href="javascript: void(0)">
              <bookmark-icon
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </a>
            <a class="text-ink-secondary mr-2 p-2 border-transparent border bg-card-dim hover:bg-card-hover cursor-pointer rounded focus:outline-none focus:border-ink focus:shadow-outline-gray" href="javascript: void(0)">
              <copy-icon
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </a>
            <a class="text-danger p-2 border-transparent border bg-card-dim hover:bg-card-hover cursor-pointer rounded focus:outline-none focus:border-ink focus:shadow-outline-gray" href="javascript: void(0)">
              <trash-icon
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </a>
          </div>
        </div>
        <div class="w-full lg:w-2/3 flex flex-col lg:flex-row items-start lg:items-center justify-end">
          <div class="flex items-center lg:border-l lg:border-r border-stroke py-3 lg:py-0 lg:px-6">
            <p id="page-view" class="text-base text-ink-secondary">
              Viewing 1 - 20 of 60
            </p>
            <a class="text-ink-secondary ml-2 border-transparent border cursor-pointer rounded" @click="pageView(false)">
              <chevron-left-icon
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </a>
            <a class="text-ink-secondary border-transparent border rounded focus:outline-none cursor-pointer" @click="pageView(true)">
              <chevron-right-icon
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </a>
          </div>
          <div class="flex items-center lg:border-r border-stroke pb-3 lg:pb-0 lg:px-6">
            <div class="relative w-32 z-10">
              <div class="pointer-events-none text-ink-secondary absolute inset-0 m-auto mr-2 xl:mr-4 z-0 w-5 h-5">
                <chevron-down-icon
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </div>

              <select aria-label="Selected tab" class="focus:outline-none border border-transparent focus:border-ink focus:shadow-outline-gray text-base form-select block w-full py-2 px-2 xl:px-3 rounded text-ink-secondary appearance-none bg-transparent">
                <option>List View</option>
                <option>Grid View</option>
              </select>
            </div>
          </div>

          <div class="lg:ml-6 flex items-center">
            <button class="bg-card-hover transition duration-150 ease-in-out focus:outline-none border border-transparent focus:border-ink focus:shadow-outline-gray hover:bg-stroke-muted rounded text-accent-fg px-5 h-8 flex items-center text-sm">
              Download All
            </button>
            <div class="text-ink-inverse ml-4 cursor-pointer focus:outline-none border border-transparent focus:border-ink focus:shadow-outline-gray bg-accent transition duration-150 ease-in-out hover:bg-accent-hover w-8 h-8 rounded flex items-center justify-center">
              <plus-icon
                width="28"
                height="28"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="w-full">
        <table class="min-w-full bg-card">
          <thead>
            <tr class="w-full h-16 border-stroke border-b py-8">
              <th class="pl-8 text-ink-secondary font-normal pr-6 text-left text-sm tracking-normal leading-4">
                <input type="checkbox" class="invisible cursor-pointer relative w-5 h-5 border rounded border-stroke bg-card outline-none" @click="checkAll">
              </th>
              <th class="text-ink-secondary font-normal pr-6 text-left text-sm tracking-normal leading-4 italic">
                {{ $t('project_name') }}
              </th>
              <th class="text-ink-secondary font-normal pr-6 text-left text-sm tracking-normal leading-4 italic">
                {{ $t('linked_project') }}
              </th>
              <th class="text-ink-secondary font-normal pr-6 text-left text-sm tracking-normal leading-4 italic">
                {{ $t('linked_area') }}
              </th>
              <td class="text-ink-secondary font-normal pr-8 text-left text-sm tracking-normal leading-4 italic">
                {{ $t('actions') }}
              </td>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projects" :key="project.id" class="h-24 border-stroke border-b">
              <td class="pl-8 pr-6 text-left whitespace-no-wrap text-sm text-ink tracking-normal leading-4">
                <input type="checkbox" class="invisible cursor-pointer relative w-5 h-5 border rounded border-stroke bg-card outline-none" @click="tableInteract">
              </td>
              <td class="text-sm pr-6 whitespace-no-wrap text-ink tracking-normal leading-4 underline">
                <Nuxt-Link :to="localeLocation({ name: 'projects-id', params: { id: project.id } })">
                  {{ project.name }}
                </Nuxt-Link>
              </td>
              <td class="text-sm pr-6 whitespace-no-wrap text-ink tracking-normal leading-4">
                {{ project.linkedProject }}
              </td>
              <td class="text-sm pr-6 whitespace-no-wrap text-ink tracking-normal leading-4">
                {{ project.linkedArea }}
              </td>
              <td class="pr-8 relative">
                <div
                  :ref="`project_dp_${project.id}`"
                  class="dropdown-content mt-8 absolute left-0 -ml-12 shadow-md z-10 w-32"
                  :class="{'hidden': !showDropDown[project.id]}"
                  tabindex="0"
                  @focusout="dismissDropdown(project)"
                >
                  <ul class="bg-card shadow rounded py-1">
                    <li
                      class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal py-3 hover:bg-accent hover:text-ink-inverse px-3 font-normal"
                      @click="edit(project.id)"
                    >
                      {{ $t('edit') }}
                    </li>
                    <li
                      class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal py-3 hover:bg-accent hover:text-ink-inverse px-3 font-normal"
                      @click="removeProject(project.id)"
                    >
                      {{ $t('delete') }}
                    </li>
                    <!--
                    <li class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal py-3 hover:bg-accent hover:text-ink-inverse px-3 font-normal">
                      Duplicate
                    </li>
                    -->
                  </ul>
                </div>
                <button
                  class="text-ink-muted rounded cursor-pointer border border-transparent focus:outline-none"
                  @click="showDropdown(project)"
                >
                  <dots-vertical-icon
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import {
  EditIcon,
  SettingsIcon,
  BookmarkIcon,
  CopyIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  DotsVerticalIcon
} from 'vue-tabler-icons'
import { mapMutations, mapGetters } from 'vuex'

export default {
  components: {
    EditIcon,
    SettingsIcon,
    BookmarkIcon,
    CopyIcon,
    TrashIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    PlusIcon,
    DotsVerticalIcon
  },
  middleware: 'auth',
  data () {
    return {
      temp: 0,
      showDropDown: {}
    }
  },
  computed: {
    projects () {
      const linkedProjects = this.apiDataProjects // this.$store.getters['apiData/projects']

      return/*  this.$store.getters['projects/visibleProjects'] */this.visibleProjects.map((p) => {
        let linkedProject = { name: '' }
        let linkedArea = linkedProject

        if (p.linkedProjectId) {
          linkedProject = linkedProjects.find(({ id }) => p.linkedProjectId === id)
          if (linkedProject && p.linkedAreaId) {
            linkedArea = linkedProject.areas.find(({ id }) => p.linkedAreaId === id)
          }
        }

        return {
          name: p.name,
          id: p.id,
          linkedProject: linkedProject?.name || '',
          linkedArea: linkedArea?.name || ''
        }
      })
    },
    ...mapGetters({
      visibleProjects: 'projects/visibleProjects',
      apiDataProjects: 'apiData/projects'
    })
  },
  methods: {
    edit (id) {
      this.$router.push(this.localeLocation({ name: 'projects-id', params: { id } }))
    },
    dismissDropdown (project) {
      this.$set(this.showDropDown, project.id, false)
    },
    showDropdown (project) {
      this.$set(this.showDropDown, project.id, true)
      this.$nextTick(() => this.$refs[`project_dp_${project.id}`][0].focus())
    },
    dropdownFunction (event) {
      const dropdowns = document.getElementsByClassName('dropdown-content')
      let i
      const list = event.currentTarget.parentElement.parentElement.getElementsByClassName('dropdown-content')[0]
      for (i = 0; i < dropdowns.length; i++) {
        dropdowns[i].classList.add('hidden')
      }
      list.classList.toggle('hidden')
    },
    documentClick (event) {
      if (!event.target.matches('.dropbtn')) {
        const dropdowns = document.getElementsByClassName('dropdown-content')
        let i
        for (i = 0; i < dropdowns.length; i++) {
          const openDropdown = dropdowns[i]
          openDropdown.classList.add('hidden')
        }
      }
    },
    checkAll (event) {
      const rows = event.currentTarget.parentElement.parentElement.parentElement.nextElementSibling.children
      for (let i = 0; i < rows.length; i++) {
        if (event.currentTarget.checked) {
          rows[i].classList.add('bg-gray-100')
          const checkbox = rows[i].getElementsByTagName('input')[0]
          if (checkbox) {
            checkbox.checked = true
          }
        } else {
          rows[i].classList.remove('bg-gray-100')
          const checkbox = rows[i].getElementsByTagName('input')[0]
          if (checkbox) {
            checkbox.checked = false
          }
        }
      }
    },
    tableInteract (event) {
      const single = event.currentTarget.parentElement.parentElement
      single.classList.toggle('bg-gray-100')
    },
    pageView (val) {
      const text = document.getElementById('page-view')
      if (val) {
        if (this.$data.temp === 2) {
          this.$data.temp = 0
        } else {
          this.$data.temp = this.$data.temp + 1
        }
      } else if (this.$data.temp !== 0) {
        this.$data.temp = this.$data.temp - 1
      }
      switch (this.$data.temp) {
        case 0:
          text.innerHTML = 'Viewing 1 - 20 of 60'
          break
        case 1:
          text.innerHTML = 'Viewing 21 - 40 of 60'
          break
        case 2:
          text.innerHTML = 'Viewing 41 - 60 of 60'
      }
    },
    ...mapMutations({
      removeProject: 'projects/remove'
    })
  }
}
</script>
